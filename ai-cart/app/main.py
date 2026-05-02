# ============================================================
# 🚀 EspritMarket Cart ML API - FastAPI Backend
# ============================================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import os
from typing import List, Optional
from datetime import datetime

# ============================================================
# 📦 APP INIT
# ============================================================
app = FastAPI(
    title="EspritMarket Cart ML API",
    description="ML-powered cart optimization: promotion suggestions and price adjustments",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:8090", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 🧠 LOAD MODELS
# ============================================================
APP_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR  = os.path.dirname(APP_DIR)
MODEL_DIR = os.path.join(ROOT_DIR, "models")

USE_TRAINED_MODEL = False
rf_promo = xgb_price = le_promo = le_price = le_category = None

try:
    if os.path.exists(os.path.join(MODEL_DIR, "rf_promo.pkl")):
        rf_promo   = joblib.load(os.path.join(MODEL_DIR, "rf_promo.pkl"))
        xgb_price  = joblib.load(os.path.join(MODEL_DIR, "xgb_price.pkl"))
        le_promo   = joblib.load(os.path.join(MODEL_DIR, "le_promo.pkl"))
        le_price   = joblib.load(os.path.join(MODEL_DIR, "le_price.pkl"))
        le_category= joblib.load(os.path.join(MODEL_DIR, "le_category.pkl"))
        USE_TRAINED_MODEL = True
        print("✅ Loaded trained models from:", MODEL_DIR)
        print(f"   Promotion classes: {le_promo.classes_}")
        print(f"   Price classes:     {le_price.classes_}")
    else:
        print(f"⚠️  No models found in {MODEL_DIR}")
        print("📌 Using rule-based fallback. Run scripts/train_model.py to train.")
except Exception as e:
    print(f"⚠️  Could not load models: {e}")
    print("📌 Using rule-based fallback")

# ============================================================
# 🎯 FEATURES
# ============================================================
FEATURES = [
    "cost_price", "unit_price", "stock", "sales_volume",
    "return_rate", "profit", "demand_score",
    "price_competitiveness_score", "cart_abandonment_rate",
    "loyalty_score", "shop_performance_index",
    "margin_pct", "revenue", "stock_to_sales_ratio",
    "profit_per_unit", "price_x_demand", "abandon_x_loyalty",
    "perf_x_demand", "category_enc"
]

# ============================================================
# 🧾 INPUT / OUTPUT MODELS
# ============================================================
class ProductInput(BaseModel):
    product_id: str
    cost_price: float
    unit_price: float
    stock: int
    sales_volume: float
    return_rate: float
    profit: float
    demand_score: float
    price_competitiveness_score: float
    cart_abandonment_rate: float
    loyalty_score: float
    shop_performance_index: float
    category: str = "General"

class BatchProductInput(BaseModel):
    products: List[ProductInput]

class PredictionResponse(BaseModel):
    product_id: str
    promotion_suggestion: str          # YES / NO
    price_adjustment: str              # INCREASE / DECREASE / STABLE
    confidence_promo: float
    confidence_price: float
    recommended_price: Optional[float] = None
    expected_impact: Optional[str] = None
    model_used: str = "rule-based"

# ============================================================
# 🧮 FEATURE ENGINEERING
# ============================================================
def engineer_features(p: ProductInput) -> dict:
    margin_pct           = (p.unit_price - p.cost_price) / p.unit_price if p.unit_price > 0 else 0
    revenue              = p.unit_price * p.sales_volume
    stock_to_sales_ratio = p.stock / (p.sales_volume + 1)
    profit_per_unit      = p.profit / (p.sales_volume + 1)
    price_x_demand       = p.unit_price * p.demand_score
    abandon_x_loyalty    = p.cart_abandonment_rate * p.loyalty_score
    perf_x_demand        = p.shop_performance_index * p.demand_score

    # Category encoding
    if USE_TRAINED_MODEL and le_category is not None:
        try:
            category_enc = float(le_category.transform([p.category])[0])
        except ValueError:
            category_enc = 0.0
    else:
        category_enc = float(hash(p.category) % 100)

    return {
        "cost_price": p.cost_price,
        "unit_price": p.unit_price,
        "stock": float(p.stock),
        "sales_volume": p.sales_volume,
        "return_rate": p.return_rate,
        "profit": p.profit,
        "demand_score": p.demand_score,
        "price_competitiveness_score": p.price_competitiveness_score,
        "cart_abandonment_rate": p.cart_abandonment_rate,
        "loyalty_score": p.loyalty_score,
        "shop_performance_index": p.shop_performance_index,
        "margin_pct": margin_pct,
        "revenue": revenue,
        "stock_to_sales_ratio": stock_to_sales_ratio,
        "profit_per_unit": profit_per_unit,
        "price_x_demand": price_x_demand,
        "abandon_x_loyalty": abandon_x_loyalty,
        "perf_x_demand": perf_x_demand,
        "category_enc": category_enc,
    }

# ============================================================
# 🧠 RULE-BASED FALLBACK (mirrors original predict_logic)
# ============================================================
def predict_rule_based(features: dict, p: ProductInput):
    demand       = features["demand_score"]
    abandon_rate = features["cart_abandonment_rate"]
    stock_ratio  = features["stock_to_sales_ratio"]

    # Promotion (YES / NO)
    if demand > 0.7 and abandon_rate < 0.3:
        promo, promo_conf = "NO", 0.85
    elif demand < 0.4 or abandon_rate > 0.5 or stock_ratio > 5:
        promo, promo_conf = "YES", 0.80
    else:
        promo, promo_conf = "NO", 0.65

    # Price adjustment
    if demand > 0.8:
        price, price_conf, factor = "INCREASE", 0.80, 1.05
    elif demand < 0.4:
        price, price_conf, factor = "DECREASE", 0.85, 0.90
    else:
        price, price_conf, factor = "STABLE", 0.70, 1.00

    return promo, price, promo_conf, price_conf, round(p.unit_price * factor, 2)

# ============================================================
# 🤖 ML MODEL PREDICTION
# ============================================================
def predict_ml(features: dict, p: ProductInput):
    input_df = pd.DataFrame([features])[FEATURES]

    promo_idx = int(rf_promo.predict(input_df)[0])
    price_idx = int(xgb_price.predict(input_df)[0])

    promo_proba = rf_promo.predict_proba(input_df)[0]
    price_proba = (xgb_price.predict_proba(input_df)[0]
                   if hasattr(xgb_price, "predict_proba") else [0.7])

    promo = le_promo.inverse_transform([promo_idx])[0]   # YES / NO
    price = le_price.inverse_transform([price_idx])[0]   # INCREASE / DECREASE / STABLE

    factor = {"INCREASE": 1.05, "DECREASE": 0.90}.get(price, 1.00)

    return (
        promo, price,
        round(float(max(promo_proba)), 2),
        round(float(max(price_proba)), 2),
        round(p.unit_price * factor, 2)
    )

# ============================================================
# 💬 IMPACT MESSAGE
# ============================================================
def impact_message(promo: str, price: str, features: dict) -> str:
    msgs = []
    if promo == "YES":
        msgs.append("Apply discount to boost sales")
    if price == "INCREASE":
        msgs.append("High demand — consider raising price")
    elif price == "DECREASE":
        msgs.append("Low demand — lower price to clear stock")
    if features["stock_to_sales_ratio"] > 5:
        msgs.append("Excess stock detected")
    if features["cart_abandonment_rate"] > 0.5:
        msgs.append("High cart abandonment — needs attention")
    return " | ".join(msgs) if msgs else "Maintain current strategy"

# ============================================================
# 🔥 ENDPOINTS
# ============================================================
@app.post("/predict", response_model=PredictionResponse)
def predict(product: ProductInput):
    try:
        features = engineer_features(product)

        if USE_TRAINED_MODEL:
            promo, price, pc, ac, rec = predict_ml(features, product)
            model_used = "trained-ml"
        else:
            promo, price, pc, ac, rec = predict_rule_based(features, product)
            model_used = "rule-based"

        return PredictionResponse(
            product_id=product.product_id,
            promotion_suggestion=promo,
            price_adjustment=price,
            confidence_promo=pc,
            confidence_price=ac,
            recommended_price=rec,
            expected_impact=impact_message(promo, price, features),
            model_used=model_used
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=List[PredictionResponse])
def predict_batch(batch: BatchProductInput):
    results = []
    for product in batch.products:
        try:
            results.append(predict(product))
        except Exception as e:
            results.append(PredictionResponse(
                product_id=product.product_id,
                promotion_suggestion="NO",
                price_adjustment="STABLE",
                confidence_promo=0.0,
                confidence_price=0.0,
                expected_impact=f"Error: {str(e)}",
                model_used="error"
            ))
    return results


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "EspritMarket Cart ML API",
        "model_type": "trained-ml" if USE_TRAINED_MODEL else "rule-based",
        "models_dir": MODEL_DIR,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/")
def home():
    return {
        "message": "🚀 EspritMarket Cart ML API is running",
        "version": "1.0.0",
        "model_status": "trained-ml" if USE_TRAINED_MODEL else "rule-based fallback",
        "docs": "/docs",
        "endpoints": {
            "single_predict": "POST /predict",
            "batch_predict":  "POST /predict/batch",
            "health":         "GET  /health"
        }
    }
