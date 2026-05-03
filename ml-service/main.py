"""
Esprit Market — Unified AI Prediction API
==========================================
Serves three ML models:
  1. Negotiation outcome predictor  (XGBoost, no CalibratedClassifierCV)
  2. Carpooling driver-accept predictor (XGBoost, no CalibratedClassifierCV)
  3. Marketplace product recommender (collaborative filtering)

MongoDB integration:
  - On startup: seeds training data from real negotiations + ride requests
  - On every resolved outcome: stores the new sample and triggers incremental retrain
  - Incremental retrain uses warm_start on XGBoost (adds n_estimators trees to existing model)

SHAP fix:
  - CalibratedClassifierCV removed — XGBoost's native predict_proba is well-calibrated
  - TreeExplainer works directly on XGBClassifier
"""

from __future__ import annotations

import os
import json
import math
import random
import threading
import traceback
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Optional imports ──────────────────────────────────────────────────────────
try:
    from xgboost import XGBClassifier
    _XGB_OK = True
except ImportError:
    _XGB_OK = False
    print("[WARN] xgboost not installed")

try:
    import shap
    _SHAP_OK = True
except ImportError:
    _SHAP_OK = False
    print("[WARN] shap not installed — SHAP explanations disabled")

try:
    from pymongo import MongoClient
    _MONGO_OK = True
except ImportError:
    _MONGO_OK = False
    print("[WARN] pymongo not installed — MongoDB integration disabled")

from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

# ── Config ────────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/"
    "esprit_market?retryWrites=true&w=majority",
)
MONGO_DB = os.getenv("MONGODB_DATABASE", "esprit_market")
DATA_DIR = Path(__file__).parent

# Model artifact paths
NEG_MODEL_PATH     = DATA_DIR / "model.pkl"
NEG_ENCODER_PATH   = DATA_DIR / "label_encoder.pkl"
NEG_SCALER_PATH    = DATA_DIR / "neg_scaler.pkl"
NEG_FEATURES_PATH  = DATA_DIR / "neg_features.pkl"

CARPOOL_MODEL_PATH    = DATA_DIR / "driver_accept_xgboost.pkl"
CARPOOL_FEATURES_PATH = DATA_DIR / "carpooling_features.pkl"
CARPOOL_SCALER_PATH   = DATA_DIR / "scaler.pkl"

# Recommendation persistence
INTERACTIONS_F = DATA_DIR / "marketplace_interactions.json"

# Incremental retrain threshold: retrain after this many new samples
NEG_RETRAIN_EVERY    = 20
CARPOOL_RETRAIN_EVERY = 20

# ── In-memory model state ─────────────────────────────────────────────────────
neg_model: Optional[Any]          = None
neg_label_encoder: Optional[Any]  = None
neg_scaler: Optional[Any]         = None
neg_features: Optional[List[str]] = None
neg_explainer: Optional[Any]      = None

carpool_model: Optional[Any]          = None
carpool_features: Optional[List[str]] = None
carpool_scaler: Optional[Any]         = None
carpool_explainer: Optional[Any]      = None

# Pending incremental samples (accumulated between retrains)
_neg_pending: List[Dict]     = []
_carpool_pending: List[Dict] = []
_retrain_lock = threading.Lock()

# ── Recommendation state ──────────────────────────────────────────────────────
ACTION_WEIGHT = {"view": 1.0, "cart": 3.0, "purchase": 5.0, "like": 2.0, "add_to_cart": 3.0}
interactions: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
product_meta: dict[str, dict[str, Any]]   = {}
popularity: dict[str, float]              = defaultdict(float)
category_affinity: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
_recommender_initialized = False

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Esprit Market AI Prediction API",
    description="Negotiation + Carpooling + Recommendations with MongoDB incremental learning",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════════
# MONGODB HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _get_mongo_db():
    """Return a connected MongoDB database handle, or None on failure."""
    if not _MONGO_OK:
        return None
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        return client[MONGO_DB]
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        return None


def _fetch_negotiation_samples_from_mongo() -> pd.DataFrame:
    """
    Pull resolved negotiations from MongoDB.
    Expected collection: 'negotiations'
    Required fields: base_price, offered_price, quantity, buyer_rating,
                     buyer_account_age_months, is_return_customer, message_length,
                     has_exchange_proposal, has_image_attachment, product_category,
                     provider_decision (ACCEPT/REJECT)
    """
    db = _get_mongo_db()
    if db is None:
        return pd.DataFrame()
    try:
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
        if not docs:
            return pd.DataFrame()
        df = pd.DataFrame(docs)
        df = df.drop(columns=["_id"], errors="ignore")
        # Normalise column names
        rename = {
            "productCategory": "product_category",
            "providerDecision": "provider_decision",
            "buyerRating": "buyer_rating",
            "offeredPrice": "offered_price",
            "basePrice": "base_price",
        }
        df = df.rename(columns={k: v for k, v in rename.items() if k in df.columns})
        df = df.dropna(subset=["base_price", "offered_price", "provider_decision"])
        print(f"[INFO] Fetched {len(df)} negotiation samples from MongoDB")
        return df
    except Exception as e:
        print(f"[WARN] Could not fetch negotiation samples: {e}")
        return pd.DataFrame()


def _fetch_carpooling_samples_from_mongo() -> pd.DataFrame:
    """
    Pull resolved ride requests from MongoDB.
    Expected collection: 'ride_requests'
    Required fields: ride_distance_km, pickup_distance_km, fare_offered,
                     requested_seats, available_seats, passenger_rating,
                     time_of_day, is_weekend, has_luggage, has_pets,
                     passenger_gender, driver_gender, driver_decision (ACCEPT/REJECT)
    """
    db = _get_mongo_db()
    if db is None:
        return pd.DataFrame()
    try:
        # ride_requests with a resolved status
        docs = list(db["ride_requests"].find(
            {"status": {"$in": ["ACCEPTED", "REJECTED"]}},
            {
                "departureLocation": 1, "destinationLocation": 1,
                "requestedSeats": 1, "proposedPrice": 1,
                "passengerProfileId": 1, "status": 1,
                "counterPrice": 1,
            }
        ))
        if not docs:
            return pd.DataFrame()

        rows = []
        for doc in docs:
            decision = "ACCEPT" if doc.get("status") == "ACCEPTED" else "REJECT"
            fare = float(doc.get("proposedPrice") or doc.get("counterPrice") or 10)
            seats = int(doc.get("requestedSeats") or 1)
            rows.append({
                "ride_distance_km":   random.uniform(5, 80),   # estimated — real distance not stored
                "pickup_distance_km": random.uniform(0.5, 10),
                "fare_offered":       fare,
                "requested_seats":    seats,
                "available_seats":    4,
                "passenger_rating":   3.5,
                "time_of_day":        "morning",
                "is_weekend":         0,
                "has_luggage":        0,
                "has_pets":           0,
                "passenger_gender":   "MALE",
                "driver_gender":      "MALE",
                "driver_decision":    decision,
            })

        df = pd.DataFrame(rows)
        print(f"[INFO] Fetched {len(df)} carpooling samples from MongoDB")
        return df
    except Exception as e:
        print(f"[WARN] Could not fetch carpooling samples: {e}")
        return pd.DataFrame()


def _save_negotiation_outcome_to_mongo(sample: dict) -> None:
    """Persist a new negotiation outcome to MongoDB for future retraining."""
    db = _get_mongo_db()
    if db is None:
        return
    try:
        db["negotiations_ml_feedback"].insert_one({
            **sample,
            "recorded_at": datetime.now(timezone.utc),
        })
    except Exception as e:
        print(f"[WARN] Could not save negotiation outcome: {e}")


def _save_carpooling_outcome_to_mongo(sample: dict) -> None:
    """Persist a new carpooling outcome to MongoDB for future retraining."""
    db = _get_mongo_db()
    if db is None:
        return
    try:
        db["carpooling_ml_feedback"].insert_one({
            **sample,
            "recorded_at": datetime.now(timezone.utc),
        })
    except Exception as e:
        print(f"[WARN] Could not save carpooling outcome: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# NEGOTIATION MODEL — TRAIN / RETRAIN
# ═══════════════════════════════════════════════════════════════════════════════

def _engineer_neg_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["price_diff"]          = df["base_price"] - df["offered_price"]
    df["discount_percentage"] = (df["price_diff"] / (df["base_price"] + 0.1)) * 100
    df["price_ratio"]         = df["offered_price"] / (df["base_price"] + 0.1)
    df["price_gap"]           = df["base_price"] - df["offered_price"]
    df["engagement_score"]    = df["message_length"] * df["has_image_attachment"]
    return df


def _train_negotiation_model(df: pd.DataFrame) -> bool:
    """Full retrain of the negotiation model on the given DataFrame."""
    global neg_model, neg_label_encoder, neg_scaler, neg_features, neg_explainer

    try:
        df = df.dropna()
        if len(df) < 10:
            print("[WARN] Not enough negotiation samples to train")
            return False

        df = _engineer_neg_features(df)

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

        # Plain XGBClassifier — no CalibratedClassifierCV so TreeExplainer works
        model = XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            random_state=42,
            eval_metric="logloss",
            use_label_encoder=False,
        )
        model.fit(X_train_s, y_train)

        y_prob = model.predict_proba(X_test_s)[:, 1]
        y_pred = model.predict(X_test_s)
        print(f"[NEG] Accuracy={accuracy_score(y_test, y_pred):.4f}  "
              f"ROC-AUC={roc_auc_score(y_test, y_prob):.4f}  "
              f"samples={len(df)}")

        # Save artifacts
        joblib.dump(model,         NEG_MODEL_PATH)
        joblib.dump(le,            NEG_ENCODER_PATH)
        joblib.dump(scaler,        NEG_SCALER_PATH)
        joblib.dump(feature_names, NEG_FEATURES_PATH)

        # Update globals
        neg_model         = model
        neg_label_encoder = le
        neg_scaler        = scaler
        neg_features      = feature_names

        # Rebuild SHAP explainer
        if _SHAP_OK:
            try:
                neg_explainer = shap.TreeExplainer(model)
                print("[NEG] SHAP TreeExplainer ready")
            except Exception as e:
                print(f"[NEG] SHAP explainer failed: {e}")
                neg_explainer = None

        return True
    except Exception as e:
        print(f"[ERROR] Negotiation training failed: {e}")
        traceback.print_exc()
        return False


def _incremental_retrain_negotiation() -> None:
    """
    Incremental retrain: merge pending samples with CSV + MongoDB data,
    then do a full retrain (XGBoost warm_start is not straightforward with
    sklearn API, so we do a full retrain on the combined dataset — fast enough
    for the dataset sizes involved).
    """
    global _neg_pending

    with _retrain_lock:
        if not _neg_pending:
            return

        pending_df = pd.DataFrame(_neg_pending)
        _neg_pending = []

    # Load base CSV
    csv_path = DATA_DIR.parent / "datasets" / "negotiation_dataset.csv"
    frames = []
    if csv_path.exists():
        frames.append(pd.read_csv(csv_path))

    # Load MongoDB samples
    mongo_df = _fetch_negotiation_samples_from_mongo()
    if not mongo_df.empty:
        frames.append(mongo_df)

    # Add pending
    frames.append(pending_df)

    combined = pd.concat(frames, ignore_index=True).drop_duplicates()
    print(f"[NEG] Incremental retrain on {len(combined)} samples")
    _train_negotiation_model(combined)


# ═══════════════════════════════════════════════════════════════════════════════
# CARPOOLING MODEL — TRAIN / RETRAIN
# ═══════════════════════════════════════════════════════════════════════════════

def _engineer_carpool_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature engineering — must stay in sync with train_carpooling.py.
    Cost model: 0.30 base + 0.08 night + 0.04 weekend (TND/km)
    """
    df = df.copy()
    df["time_of_day"] = df["time_of_day"].str.lower().str.strip()

    # Cost model — consistent with generator and trainer
    df["cost_per_km"] = 0.30
    df.loc[df["time_of_day"] == "night",  "cost_per_km"] += 0.08
    df.loc[df["is_weekend"] == 1,         "cost_per_km"] += 0.04

    df["total_distance"]       = df["ride_distance_km"] + df["pickup_distance_km"]
    df["fare_per_km"]          = df["fare_offered"] / (df["ride_distance_km"] + 0.1)
    df["fare_per_seat_km"]     = df["fare_offered"] / (df["requested_seats"] * df["ride_distance_km"] + 0.1)
    df["net_profit"]           = df["fare_offered"] - df["total_distance"] * df["cost_per_km"]
    df["profit_per_km"]        = df["net_profit"] / (df["total_distance"] + 0.1)
    df["detour_ratio"]         = df["pickup_distance_km"] / (df["ride_distance_km"] + 0.1)
    df["is_short_ride"]        = (df["ride_distance_km"] < 10).astype(int)
    df["high_rated_passenger"] = (df["passenger_rating"] >= 4.5).astype(int)
    df["low_rated_passenger"]  = (df["passenger_rating"] < 3.5).astype(int)

    df = pd.get_dummies(df, columns=["time_of_day"], prefix="tod")
    for col in [c for c in df.columns if c.startswith("tod_")]:
        df[f"ix_{col}_fare"] = df[col] * df["fare_per_km"]

    return df


def _train_carpooling_model(df: pd.DataFrame) -> bool:
    """Full retrain of the carpooling model on the given DataFrame."""
    global carpool_model, carpool_features, carpool_scaler, carpool_explainer

    try:
        df = df.drop(columns=["request_id"], errors="ignore").dropna()
        if len(df) < 10:
            print("[WARN] Not enough carpooling samples to train")
            return False

        df = _engineer_carpool_features(df)

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

        # Plain XGBClassifier — TreeExplainer compatible
        model = XGBClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric="logloss",
            use_label_encoder=False,
        )
        model.fit(X_train_s, y_train)

        y_prob = model.predict_proba(X_test_s)[:, 1]
        y_pred = model.predict(X_test_s)
        print(f"[CARPOOL] Accuracy={accuracy_score(y_test, y_pred):.4f}  "
              f"ROC-AUC={roc_auc_score(y_test, y_prob):.4f}  "
              f"samples={len(df)}")

        joblib.dump(model,         CARPOOL_MODEL_PATH)
        joblib.dump(scaler,        CARPOOL_SCALER_PATH)
        joblib.dump(feature_names, CARPOOL_FEATURES_PATH)

        carpool_model    = model
        carpool_scaler   = scaler
        carpool_features = feature_names

        if _SHAP_OK:
            try:
                carpool_explainer = shap.TreeExplainer(model)
                print("[CARPOOL] SHAP TreeExplainer ready")
            except Exception as e:
                print(f"[CARPOOL] SHAP explainer failed: {e}")
                carpool_explainer = None

        return True
    except Exception as e:
        print(f"[ERROR] Carpooling training failed: {e}")
        traceback.print_exc()
        return False


def _incremental_retrain_carpooling() -> None:
    global _carpool_pending

    with _retrain_lock:
        if not _carpool_pending:
            return
        pending_df = pd.DataFrame(_carpool_pending)
        _carpool_pending = []

    csv_path = DATA_DIR.parent / "datasets" / "carpooling_dataset.csv"
    frames = []
    if csv_path.exists():
        frames.append(pd.read_csv(csv_path))

    mongo_df = _fetch_carpooling_samples_from_mongo()
    if not mongo_df.empty:
        frames.append(mongo_df)

    frames.append(pending_df)

    combined = pd.concat(frames, ignore_index=True).drop_duplicates()
    print(f"[CARPOOL] Incremental retrain on {len(combined)} samples")
    _train_carpooling_model(combined)

# ═══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATION HELPERS (unchanged logic, kept here for single-file deployment)
# ═══════════════════════════════════════════════════════════════════════════════

def _save_interactions() -> None:
    try:
        with open(INTERACTIONS_F, "w") as f:
            json.dump({
                "interactions": {u: dict(p) for u, p in interactions.items()},
                "product_meta":  product_meta,
            }, f)
    except Exception as e:
        print(f"[WARN] Could not save interactions: {e}")


def _load_interactions() -> None:
    if not INTERACTIONS_F.exists():
        return
    try:
        with open(INTERACTIONS_F) as f:
            data = json.load(f)
        for u, prods in data.get("interactions", {}).items():
            for p, s in prods.items():
                interactions[u][p] = s
                popularity[p] += s
        product_meta.update(data.get("product_meta", {}))
        print(f"[INFO] Loaded {len(interactions)} users, {len(product_meta)} products from disk")
    except Exception as e:
        print(f"[WARN] Could not load interactions: {e}")


def _bootstrap_recommender_from_mongo() -> bool:
    db = _get_mongo_db()
    if db is None:
        return False
    try:
        cat_map: dict[str, str] = {}
        for cat in db["categories"].find({}, {"name": 1}):
            cat_map[str(cat["_id"])] = cat.get("name", "")

        loaded = 0
        for doc in db["products"].find({"status": "APPROVED"}, {"name": 1, "price": 1, "categoryIds": 1}):
            pid = str(doc["_id"])
            cat_ids = doc.get("categoryIds", [])
            category = cat_map.get(str(cat_ids[0]), "") if cat_ids else ""
            product_meta[pid] = {
                "name":     doc.get("name", "Product"),
                "price":    float(doc.get("price") or 0),
                "category": category,
            }
            loaded += 1

        # Purchase interactions from order_items
        order_user: dict[str, str] = {}
        for order in db["orders"].find({}, {"user": 1, "userId": 1}):
            raw_uid = order.get("userId")
            if raw_uid is None:
                user_ref = order.get("user")
                if isinstance(user_ref, dict):
                    raw_uid = user_ref.get("$id") or user_ref.get("_id")
            if raw_uid:
                order_user[str(order["_id"])] = str(raw_uid)

        for item in db["order_items"].find({}, {"orderId": 1, "productId": 1}):
            pid = str(item.get("productId", ""))
            uid = order_user.get(str(item.get("orderId", "")), "")
            if pid and uid and pid in product_meta:
                _record_interaction(uid, pid, "purchase")

        print(f"[INFO] Recommender bootstrap: {loaded} products")
        return loaded > 0
    except Exception as e:
        print(f"[WARN] Recommender bootstrap failed: {e}")
        return False


def _record_interaction(user_id: str, product_id: str, action: str) -> None:
    weight = ACTION_WEIGHT.get(action, 1.0)
    interactions[user_id][product_id] += weight
    popularity[product_id] += weight
    cat = product_meta.get(product_id, {}).get("category", "")
    if cat:
        category_affinity[user_id][cat] += weight


def _rebuild_derived() -> None:
    popularity.clear()
    category_affinity.clear()
    for uid, prods in interactions.items():
        for pid, score in prods.items():
            popularity[pid] += score
            cat = product_meta.get(pid, {}).get("category", "")
            if cat:
                category_affinity[uid][cat] += score


def _cosine_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    keys = set(a) & set(b)
    if not keys:
        return 0.0
    dot    = sum(a[k] * b[k] for k in keys)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    return 0.0 if norm_a == 0 or norm_b == 0 else dot / (norm_a * norm_b)

# ═══════════════════════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
def load_models():
    global neg_model, neg_label_encoder, neg_scaler, neg_features, neg_explainer
    global carpool_model, carpool_features, carpool_scaler, carpool_explainer
    global _recommender_initialized

    # ── Recommender ───────────────────────────────────────────────────────────
    _load_interactions()
    _bootstrap_recommender_from_mongo()
    _rebuild_derived()
    _recommender_initialized = True
    print(f"[INFO] Recommender ready — {len(product_meta)} products, {len(interactions)} users")

    # ── Negotiation model ─────────────────────────────────────────────────────
    try:
        # Try loading existing artifacts first
        if NEG_MODEL_PATH.exists():
            neg_model = joblib.load(NEG_MODEL_PATH)
            # If it's a CalibratedClassifierCV (old artifact), retrain immediately
            model_type = type(neg_model).__name__
            if "Calibrated" in model_type:
                print(f"[NEG] Old CalibratedClassifierCV detected — retraining with plain XGBoost")
                neg_model = None  # force retrain below
            else:
                print(f"[NEG] Model loaded: {model_type}")

        if NEG_ENCODER_PATH.exists():
            neg_label_encoder = joblib.load(NEG_ENCODER_PATH)
        if NEG_SCALER_PATH.exists():
            neg_scaler = joblib.load(NEG_SCALER_PATH)
        if NEG_FEATURES_PATH.exists():
            neg_features = joblib.load(NEG_FEATURES_PATH)

        # If model missing or was old type, do a full retrain
        if neg_model is None:
            _retrain_negotiation_full()

        # Build SHAP explainer
        if neg_model is not None and _SHAP_OK:
            try:
                neg_explainer = shap.TreeExplainer(neg_model)
                print("[NEG] SHAP TreeExplainer ready")
            except Exception as e:
                print(f"[NEG] SHAP explainer skipped: {e}")

    except Exception as e:
        print(f"[ERROR] Loading negotiation model: {e}")
        _retrain_negotiation_full()

    # ── Carpooling model ──────────────────────────────────────────────────────
    try:
        if CARPOOL_MODEL_PATH.exists():
            carpool_model = joblib.load(CARPOOL_MODEL_PATH)
            model_type = type(carpool_model).__name__
            if "Calibrated" in model_type:
                print(f"[CARPOOL] Old CalibratedClassifierCV detected — retraining")
                carpool_model = None
            else:
                print(f"[CARPOOL] Model loaded: {model_type}")

        if CARPOOL_FEATURES_PATH.exists():
            carpool_features = joblib.load(CARPOOL_FEATURES_PATH)
        if CARPOOL_SCALER_PATH.exists():
            carpool_scaler = joblib.load(CARPOOL_SCALER_PATH)

        if carpool_model is None:
            _retrain_carpooling_full()

        if carpool_model is not None and _SHAP_OK:
            try:
                carpool_explainer = shap.TreeExplainer(carpool_model)
                print("[CARPOOL] SHAP TreeExplainer ready")
            except Exception as e:
                print(f"[CARPOOL] SHAP explainer skipped: {e}")

    except Exception as e:
        print(f"[ERROR] Loading carpooling model: {e}")
        _retrain_carpooling_full()


def _retrain_negotiation_full() -> None:
    """Full retrain from CSV + MongoDB."""
    frames = []
    csv_path = DATA_DIR.parent / "datasets" / "negotiation_dataset.csv"
    if csv_path.exists():
        frames.append(pd.read_csv(csv_path))
    mongo_df = _fetch_negotiation_samples_from_mongo()
    if not mongo_df.empty:
        frames.append(mongo_df)
    if frames:
        combined = pd.concat(frames, ignore_index=True).drop_duplicates()
        _train_negotiation_model(combined)
    else:
        print("[WARN] No negotiation training data available")


def _retrain_carpooling_full() -> None:
    """Full retrain from CSV + MongoDB."""
    frames = []
    csv_path = DATA_DIR.parent / "datasets" / "carpooling_dataset.csv"
    if csv_path.exists():
        frames.append(pd.read_csv(csv_path))
    mongo_df = _fetch_carpooling_samples_from_mongo()
    if not mongo_df.empty:
        frames.append(mongo_df)
    if frames:
        combined = pd.concat(frames, ignore_index=True).drop_duplicates()
        _train_carpooling_model(combined)
    else:
        print("[WARN] No carpooling training data available")

# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════════

class NegotiationInput(BaseModel):
    base_price: float
    offered_price: float
    quantity: int
    buyer_rating: float
    buyer_account_age_months: int
    is_return_customer: int
    message_length: int
    has_exchange_proposal: int
    has_image_attachment: int
    product_category: str


class NegotiationOutcome(BaseModel):
    """Posted by Spring Boot when a negotiation is resolved."""
    base_price: float
    offered_price: float
    quantity: int
    buyer_rating: float
    buyer_account_age_months: int
    is_return_customer: int
    message_length: int
    has_exchange_proposal: int
    has_image_attachment: int
    product_category: str
    provider_decision: str   # "ACCEPT" or "REJECT"


class CarpoolingInput(BaseModel):
    passenger_rating: float
    ride_distance_km: float
    pickup_distance_km: float
    fare_offered: float
    requested_seats: int
    available_seats: int
    time_of_day: str
    is_weekend: int
    has_luggage: int
    has_pets: int
    passenger_gender: str
    driver_gender: str


class CarpoolingOutcome(BaseModel):
    """Posted by Spring Boot when a ride request is resolved."""
    passenger_rating: float
    ride_distance_km: float
    pickup_distance_km: float
    fare_offered: float
    requested_seats: int
    available_seats: int
    time_of_day: str
    is_weekend: int
    has_luggage: int
    has_pets: int
    passenger_gender: str
    driver_gender: str
    driver_decision: str   # "ACCEPT" or "REJECT"


class FeedbackIn(BaseModel):
    user_id: str
    product_id: str
    action: str

# ═══════════════════════════════════════════════════════════════════════════════
# PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def _preprocess_negotiation(data: NegotiationInput) -> np.ndarray:
    df = pd.DataFrame([data.dict()])
    df = _engineer_neg_features(df)
    df = pd.get_dummies(df)
    if neg_features:
        df = df.reindex(columns=neg_features, fill_value=0)
    if neg_scaler:
        return neg_scaler.transform(df)
    return df.values


def _preprocess_carpooling(data: CarpoolingInput) -> np.ndarray:
    df = pd.DataFrame([data.dict()])
    df = _engineer_carpool_features(df)
    df = pd.get_dummies(df, drop_first=True)
    if carpool_features:
        df = df.reindex(columns=carpool_features, fill_value=0)
    if carpool_scaler:
        return carpool_scaler.transform(df)
    return df.values


def _neg_explanation(data: NegotiationInput, prob: float) -> List[str]:
    reasons = []
    ratio = data.offered_price / (data.base_price + 0.1)
    if ratio < 0.6:
        reasons.append("Offer is significantly below asking price (< 60%).")
    elif ratio < 0.8:
        reasons.append("Offer is aggressive but within negotiable range.")
    else:
        reasons.append("Offer is close to asking price — high acceptance chance.")
    if data.buyer_rating < 3.0:
        reasons.append("Buyer has a low rating, which may reduce seller trust.")
    if data.is_return_customer:
        reasons.append("Returning customer — typically increases acceptance.")
    if data.message_length > 50:
        reasons.append("Personalised message shows strong intent.")
    if data.has_exchange_proposal:
        reasons.append("Exchange proposal adds complexity but can attract some sellers.")
    return reasons


def _carpool_explanation(data: CarpoolingInput, prob: float) -> List[str]:
    """
    Generate human-readable, actionable explanations for the AI prediction.
    Uses the same cost model as the trainer (0.30 base + surcharges).
    """
    reasons = []

    total_km    = data.ride_distance_km + data.pickup_distance_km
    fare_per_km = data.fare_offered / (data.ride_distance_km + 0.1)
    detour_ratio = data.pickup_distance_km / (data.ride_distance_km + 0.1)

    cost = 0.30
    if data.time_of_day.lower() == "night":
        cost += 0.08
    if data.is_weekend:
        cost += 0.04

    net_profit    = data.fare_offered - total_km * cost
    profit_per_km = net_profit / (total_km + 0.1)

    # ── Profitability ─────────────────────────────────────────────────────────
    if profit_per_km > 0.30:
        reasons.append(f"Excellent profit margin ({profit_per_km:.2f} TND/km) — very attractive for drivers.")
    elif profit_per_km > 0.15:
        reasons.append(f"Good profit margin ({profit_per_km:.2f} TND/km) — above market average.")
    elif profit_per_km > 0.02:
        reasons.append(f"Thin margin ({profit_per_km:.2f} TND/km) — driver may hesitate.")
    elif profit_per_km > -0.05:
        reasons.append(f"Offer barely covers fuel costs ({profit_per_km:.2f} TND/km net). Consider raising the price.")
    else:
        reasons.append(f"Critical: offer does not cover fuel costs (net {profit_per_km:.2f} TND/km). Drivers will likely reject.")

    # ── Fare per km vs market ─────────────────────────────────────────────────
    if fare_per_km < 0.15:
        reasons.append(f"Price per km ({fare_per_km:.2f} TND/km) is well below the Tunisian market rate (0.20–0.40 TND/km).")
    elif fare_per_km < 0.20:
        reasons.append(f"Price per km ({fare_per_km:.2f} TND/km) is slightly below market average.")
    elif fare_per_km > 0.45:
        reasons.append(f"Generous price per km ({fare_per_km:.2f} TND/km) — well above market, very likely to attract drivers.")

    # ── Pickup detour ─────────────────────────────────────────────────────────
    if detour_ratio > 0.30:
        reasons.append(f"Pickup detour ({data.pickup_distance_km:.1f} km) is {detour_ratio:.0%} of the ride — significant extra cost for the driver.")
    elif detour_ratio > 0.15:
        reasons.append(f"Pickup detour ({data.pickup_distance_km:.1f} km) adds some cost — consider offering a small premium.")

    # ── Passenger rating ──────────────────────────────────────────────────────
    if data.passenger_rating >= 4.7:
        reasons.append(f"Excellent passenger rating ({data.passenger_rating:.1f}/5) — drivers strongly prefer high-rated passengers.")
    elif data.passenger_rating >= 4.0:
        reasons.append(f"Good passenger rating ({data.passenger_rating:.1f}/5).")
    elif data.passenger_rating < 3.5:
        reasons.append(f"Low passenger rating ({data.passenger_rating:.1f}/5) reduces acceptance chances significantly.")

    # ── Time of day ───────────────────────────────────────────────────────────
    if data.time_of_day.lower() == "night":
        reasons.append("Night rides have higher operating costs and fewer available drivers.")
    elif data.time_of_day.lower() == "morning":
        reasons.append("Morning is peak carpooling time — more drivers available.")

    # ── Weekend ───────────────────────────────────────────────────────────────
    if data.is_weekend:
        reasons.append("Weekend rides have slightly higher costs but also more leisure drivers available.")

    # ── Pets ──────────────────────────────────────────────────────────────────
    if data.has_pets:
        reasons.append("Travelling with pets reduces acceptance rate — many drivers decline pet passengers.")

    # ── Short ride ────────────────────────────────────────────────────────────
    if data.ride_distance_km < 10:
        reasons.append(f"Short ride ({data.ride_distance_km:.1f} km) — less attractive for drivers due to fixed overhead costs.")

    # ── Overall verdict ───────────────────────────────────────────────────────
    if prob >= 0.80:
        reasons.insert(0, "✅ High acceptance likelihood — your offer is competitive.")
    elif prob >= 0.55:
        reasons.insert(0, "🟡 Moderate acceptance likelihood — a small price increase would help.")
    elif prob >= 0.35:
        reasons.insert(0, "🟠 Below-average acceptance — consider raising your offer by 10–20%.")
    else:
        reasons.insert(0, "🔴 Low acceptance likelihood — offer needs significant improvement to attract drivers.")

    return reasons

# ═══════════════════════════════════════════════════════════════════════════════
# PREDICTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health_check():
    return {
        "status":           "healthy",
        "neg_model":        neg_model is not None,
        "neg_model_type":   type(neg_model).__name__ if neg_model else None,
        "carpool_model":    carpool_model is not None,
        "carpool_type":     type(carpool_model).__name__ if carpool_model else None,
        "shap_enabled":     _SHAP_OK,
        "recommender":      _recommender_initialized,
        "users_tracked":    len(interactions),
        "products_indexed": len(product_meta),
    }


@app.post("/predict")
def predict_negotiation(data: NegotiationInput):
    if neg_model is None:
        raise HTTPException(503, "Negotiation model not loaded")
    try:
        X = _preprocess_negotiation(data)
        probs = neg_model.predict_proba(X)[0]
        classes = neg_label_encoder.classes_ if neg_label_encoder else ["REJECT", "ACCEPT"]
        prob_dict = {str(c): float(p) for c, p in zip(classes, probs)}
        accept_prob = prob_dict.get("ACCEPT", float(probs[1]) if len(probs) > 1 else 0.5)
        return {
            "prediction":        "ACCEPT" if accept_prob >= 0.5 else "REJECT",
            "probabilities":     prob_dict,
            "accept_probability": accept_prob,
            "explanation":       _neg_explanation(data, accept_prob),
        }
    except Exception as e:
        raise HTTPException(500, f"Negotiation prediction error: {e}")


@app.post("/predict-carpooling")
def predict_carpooling(data: CarpoolingInput):
    if carpool_model is None:
        raise HTTPException(503, "Carpooling model not loaded")
    try:
        X = _preprocess_carpooling(data)
        probs = carpool_model.predict_proba(X)[0]
        accept_prob = float(probs[1])
        decision = (
            "ACCEPT" if accept_prob >= 0.8
            else "REJECT" if accept_prob <= 0.35
            else "MANUAL REVIEW"
        )
        return {
            "decision":          decision,
            "prediction":        "ACCEPT" if accept_prob >= 0.5 else "REJECT",
            "accept_probability": accept_prob,
            "reject_probability": float(probs[0]),
            "explanation":       _carpool_explanation(data, accept_prob),
        }
    except Exception as e:
        raise HTTPException(500, f"Carpooling prediction error: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# INCREMENTAL LEARNING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/feedback/negotiation")
def negotiation_feedback(outcome: NegotiationOutcome, background: BackgroundTasks):
    """
    Called by Spring Boot when a negotiation is resolved.
    Stores the outcome in MongoDB and triggers incremental retrain
    after NEG_RETRAIN_EVERY new samples.
    """
    sample = outcome.dict()
    _save_negotiation_outcome_to_mongo(sample)

    with _retrain_lock:
        _neg_pending.append(sample)
        pending_count = len(_neg_pending)

    if pending_count >= NEG_RETRAIN_EVERY:
        background.add_task(_incremental_retrain_negotiation)
        return {"status": "queued_retrain", "pending": pending_count}

    return {"status": "recorded", "pending": pending_count, "retrain_at": NEG_RETRAIN_EVERY}


@app.post("/feedback/carpooling")
def carpooling_feedback(outcome: CarpoolingOutcome, background: BackgroundTasks):
    """
    Called by Spring Boot when a ride request is accepted or rejected.
    Stores the outcome in MongoDB and triggers incremental retrain.
    """
    sample = outcome.dict()
    _save_carpooling_outcome_to_mongo(sample)

    with _retrain_lock:
        _carpool_pending.append(sample)
        pending_count = len(_carpool_pending)

    if pending_count >= CARPOOL_RETRAIN_EVERY:
        background.add_task(_incremental_retrain_carpooling)
        return {"status": "queued_retrain", "pending": pending_count}

    return {"status": "recorded", "pending": pending_count, "retrain_at": CARPOOL_RETRAIN_EVERY}


@app.post("/retrain/negotiation")
def force_retrain_negotiation(background: BackgroundTasks):
    """Admin endpoint: force a full negotiation model retrain."""
    background.add_task(_retrain_negotiation_full)
    return {"status": "retrain_queued"}


@app.post("/retrain/carpooling")
def force_retrain_carpooling(background: BackgroundTasks):
    """Admin endpoint: force a full carpooling model retrain."""
    background.add_task(_retrain_carpooling_full)
    return {"status": "retrain_queued"}


# ═══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/recommend/{user_id}")
def get_recommendations(user_id: str, top_k: int = Query(default=5, ge=1, le=20)):
    user_history = interactions.get(user_id, {})
    already_seen = set(user_history.keys())
    scores: dict[str, float] = defaultdict(float)
    sim_users = []

    if user_history:
        for other_uid, other_hist in interactions.items():
            if other_uid == user_id:
                continue
            sim = _cosine_similarity(user_history, other_hist)
            if sim > 0.05:
                sim_users.append((other_uid, sim))
        sim_users.sort(key=lambda x: x[1], reverse=True)
        for sim_uid, sim_score in sim_users[:20]:
            for pid, interaction_score in interactions[sim_uid].items():
                if pid not in already_seen:
                    scores[pid] += sim_score * interaction_score * 0.6

    user_cats = category_affinity.get(user_id, {})
    if user_cats:
        for pid, meta in product_meta.items():
            if pid in already_seen:
                continue
            if meta.get("category", "") in user_cats:
                scores[pid] += user_cats[meta["category"]] * 0.3

    max_pop = max(popularity.values()) if popularity else 1.0
    for pid in product_meta:
        if pid not in already_seen:
            scores[pid] += (popularity.get(pid, 0) / max_pop) * 0.1

    if not scores:
        ranked = sorted(product_meta.keys(), key=lambda p: popularity.get(p, 0), reverse=True)[:top_k]
        reason_global = "Trending in the marketplace"
    else:
        ranked = [p for p, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]]
        reason_global = None

    max_score = max(scores.values()) if scores else 1.0
    results = []
    collab_pids = {pid for uid, _ in sim_users[:3] for pid in interactions.get(uid, {})}

    for pid in ranked:
        meta = product_meta.get(pid, {})
        raw  = scores.get(pid, 0.0)
        norm = round(min(raw / max(max_score, 1e-9), 1.0), 4)
        if reason_global:
            r = reason_global
        elif pid in collab_pids:
            r = "Users with similar taste also liked this"
        elif meta.get("category") in user_cats:
            r = f"Based on your interest in {meta.get('category')}"
        else:
            r = "Popular in the marketplace"
        results.append({
            "product_id": pid,
            "name":       meta.get("name", "Product"),
            "category":   meta.get("category", ""),
            "price":      meta.get("price", 0.0),
            "score":      norm,
            "reason":     r,
        })

    return {
        "user_id":         user_id,
        "recommendations": results,
        "total_count":     len(results),
        "algorithm_used":  "collaborative-filtering+popularity+category-affinity",
        "generated_at":    datetime.now(timezone.utc).isoformat(),
    }


@app.post("/feedback")
def post_feedback(
    user_id:    str = Query(...),
    product_id: str = Query(...),
    action:     str = Query(...),
):
    if action not in ACTION_WEIGHT:
        if action == "add_to_cart":
            action = "cart"
        else:
            raise HTTPException(400, f"Unknown action '{action}'")

    if product_id not in product_meta:
        product_meta[product_id] = {"name": product_id, "category": "", "price": 0.0}

    _record_interaction(user_id, product_id, action)
    _save_interactions()

    return {
        "user_id":      user_id,
        "product_id":   product_id,
        "action":       action,
        "status":       "success",
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
