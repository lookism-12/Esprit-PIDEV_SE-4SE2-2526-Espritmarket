# ============================================================
# 🚀 EspritMarket Cart & Marketplace ML API — FastAPI
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

# ── App init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EspritMarket Marketplace ML API",
    description="ML-powered promotion suggestions and price adjustments for the marketplace",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model loading ─────────────────────────────────────────────────────────────
APP_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR  = os.path.dirname(APP_DIR)
MODEL_DIR = os.path.join(ROOT_DIR, "models")

USE_TRAINED_MODEL = False
rf_promo = xgb_price = le_promo = le_price = le_category = None

try:
    rf_promo    = joblib.load(os.path.join(MODEL_DIR, "rf_promo.pkl"))
    xgb_price   = joblib.load(os.path.join(MODEL_DIR, "xgb_price.pkl"))
    le_promo    = joblib.load(os.path.join(MODEL_DIR, "le_promo.pkl"))
    le_price    = joblib.load(os.path.join(MODEL_DIR, "le_price.pkl"))
    le_category = joblib.load(os.path.join(MODEL_DIR, "le_category.pkl"))
    USE_TRAINED_MODEL = True
    print(f"✅ Models loaded from {MODEL_DIR}")
    print(f"   Promo classes : {le_promo.classes_}")
    print(f"   Price classes : {le_price.classes_}")
except Exception as e:
    print(f"⚠️  Could not load models: {e} — using rule-based fallback")

# ── Feature list (must match training) ───────────────────────────────────────
FEATURES = [
    "cost_price", "unit_price", "stock", "sales_volume",
    "return_rate", "profit", "demand_score",
    "price_competitiveness_score", "cart_abandonment_rate",
    "loyalty_score", "shop_performance_index",
    "margin_pct", "revenue", "stock_to_sales_ratio",
    "profit_per_unit", "price_x_demand", "abandon_x_loyalty",
    "perf_x_demand", "category_enc",
]

# ── Schemas ───────────────────────────────────────────────────────────────────
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

# ── Feature engineering ───────────────────────────────────────────────────────
def engineer_features(p: ProductInput) -> dict:
    margin_pct            = (p.unit_price - p.cost_price) / p.unit_price if p.unit_price > 0 else 0
    revenue               = p.unit_price * p.sales_volume
    stock_to_sales_ratio  = p.stock / (p.sales_volume + 1)
    profit_per_unit       = p.profit / (p.sales_volume + 1)
    price_x_demand        = p.unit_price * p.demand_score
    abandon_x_loyalty     = p.cart_abandonment_rate * p.loyalty_score
    perf_x_demand         = p.shop_performance_index * p.demand_score

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

# ── Rule-based fallback ───────────────────────────────────────────────────────
def predict_rule_based(features: dict, p: ProductInput):
    demand       = features["demand_score"]
    abandon_rate = features["cart_abandonment_rate"]
    stock_ratio  = features["stock_to_sales_ratio"]

    if demand > 0.7 and abandon_rate < 0.3:
        promo, promo_conf = "NO", 0.85
    elif demand < 0.4 or abandon_rate > 0.5 or stock_ratio > 5:
        promo, promo_conf = "YES", 0.80
    else:
        promo, promo_conf = "NO", 0.65

    if demand > 0.8:
        price, price_conf, factor = "INCREASE", 0.80, 1.05
    elif demand < 0.4:
        price, price_conf, factor = "DECREASE", 0.85, 0.90
    else:
        price, price_conf, factor = "STABLE", 0.70, 1.00

    return promo, price, promo_conf, price_conf, round(p.unit_price * factor, 2)

# ── ML prediction ─────────────────────────────────────────────────────────────
def predict_ml(features: dict, p: ProductInput):
    input_df = pd.DataFrame([features])[FEATURES]

    promo_idx  = int(rf_promo.predict(input_df)[0])
    price_idx  = int(xgb_price.predict(input_df)[0])

    promo_proba = rf_promo.predict_proba(input_df)[0]
    price_proba = (xgb_price.predict_proba(input_df)[0]
                   if hasattr(xgb_price, "predict_proba") else [0.7])

    promo = le_promo.inverse_transform([promo_idx])[0]
    price = le_price.inverse_transform([price_idx])[0]

    factor = {"INCREASE": 1.05, "DECREASE": 0.90}.get(price, 1.00)

    return (
        promo, price,
        round(float(max(promo_proba)), 2),
        round(float(max(price_proba)), 2),
        round(p.unit_price * factor, 2),
    )

# ── Impact message ────────────────────────────────────────────────────────────
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

# ── Core predict logic ────────────────────────────────────────────────────────
def _predict_one(product: ProductInput) -> PredictionResponse:
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
        model_used=model_used,
    )

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "EspritMarket Marketplace ML API",
        "model_type": "trained-ml" if USE_TRAINED_MODEL else "rule-based",
        "promo_classes": list(le_promo.classes_) if le_promo else [],
        "price_classes": list(le_price.classes_) if le_price else [],
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/")
def home():
    return {
        "message": "🚀 EspritMarket Marketplace ML API",
        "version": "2.0.0",
        "model_status": "trained-ml" if USE_TRAINED_MODEL else "rule-based fallback",
        "docs": "/docs",
    }

# Cart endpoints (used by cart page)
@app.post("/predict", response_model=PredictionResponse)
def predict(product: ProductInput):
    try:
        return _predict_one(product)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=List[PredictionResponse])
def predict_batch(batch: BatchProductInput):
    results = []
    for product in batch.products:
        try:
            results.append(_predict_one(product))
        except Exception as e:
            results.append(PredictionResponse(
                product_id=product.product_id,
                promotion_suggestion="NO",
                price_adjustment="STABLE",
                confidence_promo=0.0,
                confidence_price=0.0,
                expected_impact=f"Error: {str(e)}",
                model_used="error",
            ))
    return results

# Marketplace endpoint (used by product listing & product details)
@app.post("/predict/marketplace", response_model=PredictionResponse)
def predict_marketplace(product: ProductInput):
    """
    Same model, dedicated endpoint for the marketplace page.
    Returns promotion badge + price insight for a single product.
    """
    try:
        return _predict_one(product)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/marketplace/batch", response_model=List[PredictionResponse])
def predict_marketplace_batch(batch: BatchProductInput):
    """Batch predictions for the full product listing page."""
    results = []
    for product in batch.products:
        try:
            results.append(_predict_one(product))
        except Exception as e:
            results.append(PredictionResponse(
                product_id=product.product_id,
                promotion_suggestion="NO",
                price_adjustment="STABLE",
                confidence_promo=0.0,
                confidence_price=0.0,
                expected_impact=f"Error: {str(e)}",
                model_used="error",
            ))
    return results
