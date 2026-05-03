"""
Carpooling driver-accept model — training script.

Cost model (must match generate_carpooling_data.py):
  base cost = 0.30 TND/km
  night     = +0.08 TND/km
  weekend   = +0.04 TND/km

Features engineered:
  - fare_per_km, fare_per_seat_km
  - net_profit, profit_per_km
  - detour_ratio (pickup / ride distance)
  - is_short_ride (< 10 km)
  - time-of-day dummies + interaction with fare_per_km
"""

import os
import sys
import random
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss, classification_report
from xgboost import XGBClassifier
import joblib

try:
    from pymongo import MongoClient
    _MONGO_OK = True
except ImportError:
    _MONGO_OK = False

MONGO_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/"
    "esprit_market?retryWrites=true&w=majority",
)
MONGO_DB = os.getenv("MONGODB_DATABASE", "esprit_market")

CSV_PATH      = "../datasets/carpooling_dataset.csv"
MODEL_PATH    = "driver_accept_xgboost.pkl"
SCALER_PATH   = "scaler.pkl"
FEATURES_PATH = "carpooling_features.pkl"

# ── Cost constants (must match generator) ─────────────────────────────────────
BASE_COST   = 0.30
NIGHT_COST  = 0.08
WKND_COST   = 0.04


def fetch_mongo_samples() -> pd.DataFrame:
    if not _MONGO_OK:
        return pd.DataFrame()
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[MONGO_DB]
        client.admin.command("ping")

        docs    = list(db["ride_requests"].find(
            {"status": {"$in": ["ACCEPTED", "REJECTED"]}},
            {"requestedSeats": 1, "proposedPrice": 1, "counterPrice": 1, "status": 1}
        ))
        docs_fb = list(db["carpooling_ml_feedback"].find(
            {"driver_decision": {"$in": ["ACCEPT", "REJECT"]}}
        ))
        client.close()

        rows = []
        for doc in docs:
            decision = "ACCEPT" if doc.get("status") == "ACCEPTED" else "REJECT"
            fare  = float(doc.get("proposedPrice") or doc.get("counterPrice") or 10)
            seats = int(doc.get("requestedSeats") or 1)
            rows.append({
                "ride_distance_km":   random.uniform(10, 200),
                "pickup_distance_km": random.uniform(0.5, 8),
                "fare_offered":       fare,
                "requested_seats":    seats,
                "available_seats":    4,
                "passenger_rating":   3.8,
                "time_of_day":        "morning",
                "is_weekend":         0,
                "has_luggage":        0,
                "has_pets":           0,
                "passenger_gender":   "MALE",
                "driver_gender":      "MALE",
                "driver_decision":    decision,
            })

        for doc in docs_fb:
            doc.pop("_id", None)
            doc.pop("recorded_at", None)
            rows.append(doc)

        if not rows:
            return pd.DataFrame()
        df = pd.DataFrame(rows)
        print(f"[MongoDB] {len(df)} carpooling samples")
        return df
    except Exception as e:
        print(f"[WARN] MongoDB fetch failed: {e}")
        return pd.DataFrame()


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["time_of_day"] = df["time_of_day"].str.lower().str.strip()

    # Cost model — consistent with generator
    df["cost_per_km"] = BASE_COST
    df.loc[df["time_of_day"] == "night",  "cost_per_km"] += NIGHT_COST
    df.loc[df["is_weekend"] == 1,         "cost_per_km"] += WKND_COST

    df["total_distance"]      = df["ride_distance_km"] + df["pickup_distance_km"]
    df["fare_per_km"]         = df["fare_offered"] / (df["ride_distance_km"] + 0.1)
    df["fare_per_seat_km"]    = df["fare_offered"] / (df["requested_seats"] * df["ride_distance_km"] + 0.1)
    df["net_profit"]          = df["fare_offered"] - df["total_distance"] * df["cost_per_km"]
    df["profit_per_km"]       = df["net_profit"] / (df["total_distance"] + 0.1)
    df["detour_ratio"]        = df["pickup_distance_km"] / (df["ride_distance_km"] + 0.1)
    df["is_short_ride"]       = (df["ride_distance_km"] < 10).astype(int)
    df["high_rated_passenger"]= (df["passenger_rating"] >= 4.5).astype(int)
    df["low_rated_passenger"] = (df["passenger_rating"] < 3.5).astype(int)

    # Time-of-day dummies + interaction with fare_per_km
    df = pd.get_dummies(df, columns=["time_of_day"], prefix="tod")
    for col in [c for c in df.columns if c.startswith("tod_")]:
        df[f"ix_{col}_fare"] = df[col] * df["fare_per_km"]

    return df


def train():
    print("=== Carpooling Model Training ===")

    frames = []
    if os.path.exists(CSV_PATH):
        df_csv = pd.read_csv(CSV_PATH)
        frames.append(df_csv)
        print(f"CSV: {len(df_csv)} rows")
    else:
        print(f"[WARN] CSV not found at {CSV_PATH} — run generate_carpooling_data.py first")

    df_mongo = fetch_mongo_samples()
    if not df_mongo.empty:
        frames.append(df_mongo)

    if not frames:
        print("ERROR: No training data found")
        sys.exit(1)

    df = pd.concat(frames, ignore_index=True)
    df = df.drop(columns=["request_id"], errors="ignore").dropna()
    print(f"Total samples: {len(df)}")

    accept_rate = (df["driver_decision"].str.upper().isin(["ACCEPT", "1", "1.0"])).mean()
    print(f"Accept rate: {accept_rate:.1%}")

    df = engineer_features(df)

    y = df["driver_decision"].apply(
        lambda x: 1 if str(x).upper() in ["ACCEPT", "1", "1.0"] else 0
    )
    X = df.drop(columns=["driver_decision"])
    X = pd.get_dummies(X, drop_first=True)
    feature_names = X.columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    model = XGBClassifier(
        n_estimators=400,
        learning_rate=0.04,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        random_state=42,
        eval_metric="logloss",
        use_label_encoder=False,
    )
    print("Training XGBClassifier...")
    model.fit(X_train_s, y_train)

    y_prob = model.predict_proba(X_test_s)[:, 1]
    y_pred = model.predict(X_test_s)
    print(f"\nAccuracy:    {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC:     {roc_auc_score(y_test, y_prob):.4f}")
    print(f"Brier Score: {brier_score_loss(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["REJECT", "ACCEPT"]))

    joblib.dump(model,         MODEL_PATH)
    joblib.dump(scaler,        SCALER_PATH)
    joblib.dump(feature_names, FEATURES_PATH)
    print(f"\nArtifacts saved: {MODEL_PATH}, {SCALER_PATH}, {FEATURES_PATH}")


if __name__ == "__main__":
    train()
