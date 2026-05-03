"""
Negotiation model training script.
Combines CSV dataset + MongoDB data, trains a plain XGBClassifier
(no CalibratedClassifierCV so SHAP TreeExplainer works).
"""
import os
import sys
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss
from xgboost import XGBClassifier
import joblib

# Optional MongoDB
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
MONGO_DB  = os.getenv("MONGODB_DATABASE", "esprit_market")

CSV_PATH      = os.path.join("..", "datasets", "negotiation_dataset.csv")
MODEL_PATH    = "model.pkl"
ENCODER_PATH  = "label_encoder.pkl"
SCALER_PATH   = "neg_scaler.pkl"
FEATURES_PATH = "neg_features.pkl"


def fetch_mongo_samples() -> pd.DataFrame:
    if not _MONGO_OK:
        return pd.DataFrame()
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[MONGO_DB]
        client.admin.command("ping")

        docs = list(db["negotiations"].find(
            {"provider_decision": {"$in": ["ACCEPT", "REJECT"]}},
            {
                "base_price": 1, "offered_price": 1, "quantity": 1,
                "buyer_rating": 1, "buyer_account_age_months": 1,
                "is_return_customer": 1, "message_length": 1,
                "has_exchange_proposal": 1, "has_image_attachment": 1,
                "product_category": 1, "provider_decision": 1,
            }
        ))
        # Also pull from the ML feedback collection
        docs += list(db["negotiations_ml_feedback"].find(
            {"provider_decision": {"$in": ["ACCEPT", "REJECT"]}},
            {
                "base_price": 1, "offered_price": 1, "quantity": 1,
                "buyer_rating": 1, "buyer_account_age_months": 1,
                "is_return_customer": 1, "message_length": 1,
                "has_exchange_proposal": 1, "has_image_attachment": 1,
                "product_category": 1, "provider_decision": 1,
            }
        ))
        client.close()

        if not docs:
            return pd.DataFrame()
        df = pd.DataFrame(docs).drop(columns=["_id"], errors="ignore")
        df = df.dropna(subset=["base_price", "offered_price", "provider_decision"])
        print(f"[MongoDB] Fetched {len(df)} negotiation samples")
        return df
    except Exception as e:
        print(f"[WARN] MongoDB fetch failed: {e}")
        return pd.DataFrame()


def train():
    print("=== Negotiation Model Training ===")

    frames = []
    if os.path.exists(CSV_PATH):
        df_csv = pd.read_csv(CSV_PATH)
        frames.append(df_csv)
        print(f"CSV: {len(df_csv)} rows")

    df_mongo = fetch_mongo_samples()
    if not df_mongo.empty:
        frames.append(df_mongo)

    if not frames:
        print("ERROR: No training data found")
        sys.exit(1)

    df = pd.concat(frames, ignore_index=True).drop_duplicates().dropna()
    print(f"Total training samples: {len(df)}")

    # Feature engineering
    df["price_diff"]          = df["base_price"] - df["offered_price"]
    df["discount_percentage"] = (df["price_diff"] / (df["base_price"] + 0.1)) * 100
    df["price_ratio"]         = df["offered_price"] / (df["base_price"] + 0.1)
    df["price_gap"]           = df["base_price"] - df["offered_price"]
    df["engagement_score"]    = df["message_length"] * df["has_image_attachment"]

    le = LabelEncoder()
    y  = le.fit_transform(df["provider_decision"])

    drop_cols = [c for c in ["provider_decision", "offer_id"] if c in df.columns]
    X = df.drop(columns=drop_cols)
    X = pd.get_dummies(X)
    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    # Plain XGBClassifier — SHAP TreeExplainer compatible
    model = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        random_state=42,
        eval_metric="logloss",
        use_label_encoder=False,
    )
    print("Training XGBClassifier...")
    model.fit(X_train_s, y_train)

    y_prob = model.predict_proba(X_test_s)[:, 1]
    y_pred = model.predict(X_test_s)
    print(f"Accuracy:    {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC:     {roc_auc_score(y_test, y_prob):.4f}")
    print(f"Brier Score: {brier_score_loss(y_test, y_prob):.4f}")

    joblib.dump(model,         MODEL_PATH)
    joblib.dump(le,            ENCODER_PATH)
    joblib.dump(scaler,        SCALER_PATH)
    joblib.dump(feature_names, FEATURES_PATH)
    print("Artifacts saved.")


if __name__ == "__main__":
    train()
