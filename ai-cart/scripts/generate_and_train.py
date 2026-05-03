"""
EspritMarket Marketplace ML — Data Generation + Training
=========================================================
Generates a rich 10 000-row synthetic dataset that mirrors real
e-commerce patterns, then trains two models:
  • rf_promo   → RandomForest  → promotion_suggestion (YES / NO)
  • xgb_price  → XGBoost       → price_adjustment     (INCREASE / DECREASE / STABLE)

Run from the ai-cart/ directory:
    python scripts/generate_and_train.py
"""

import os, warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, f1_score
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")
np.random.seed(42)

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR     = os.path.dirname(SCRIPT_DIR)
DATASET_PATH = os.path.join(ROOT_DIR, "ecommerce_ml_dataset.csv")
MODEL_DIR    = os.path.join(ROOT_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

N_ROWS = 10_000

CATEGORIES = [
    "Electronics", "Clothing", "Beauty", "Home & Living",
    "Sports", "Books", "Food & Grocery", "Toys",
]

# ── 1. Generate synthetic dataset ─────────────────────────────────────────────
print(f"🔧 Generating {N_ROWS:,} synthetic rows …")

rng = np.random.default_rng(42)

product_ids = [f"PROD_{i:05d}" for i in range(1, N_ROWS + 1)]
shop_ids    = [f"SHOP_{rng.integers(1, 51):03d}" for _ in range(N_ROWS)]
categories  = rng.choice(CATEGORIES, size=N_ROWS)

cost_price  = rng.uniform(5, 300, N_ROWS).round(2)
unit_price  = (cost_price * rng.uniform(1.2, 4.0, N_ROWS)).round(2)
stock       = rng.integers(0, 500, N_ROWS)
sales_volume = rng.integers(0, 1000, N_ROWS).astype(float)
return_rate  = rng.uniform(0.0, 0.45, N_ROWS).round(3)
profit       = ((unit_price - cost_price) * sales_volume * (1 - return_rate)).round(2)

demand_score               = rng.uniform(0.05, 1.0, N_ROWS).round(3)
price_competitiveness_score = rng.uniform(0.1, 1.0, N_ROWS).round(3)
cart_abandonment_rate       = rng.uniform(0.05, 0.9, N_ROWS).round(3)
loyalty_score               = rng.uniform(0.0, 1.0, N_ROWS).round(3)
shop_performance_index      = rng.uniform(0.1, 1.0, N_ROWS).round(3)

# ── Deterministic labels (business rules → clean signal for the model) ─────────
margin_pct = (unit_price - cost_price) / np.where(unit_price > 0, unit_price, 1)
stock_to_sales = stock / (sales_volume + 1)

# promotion_suggestion: YES when demand is low OR abandonment is high OR excess stock
promo_score = (
    (1 - demand_score) * 0.35
    + cart_abandonment_rate * 0.30
    + np.clip(stock_to_sales / 10, 0, 1) * 0.20
    + (1 - price_competitiveness_score) * 0.15
)
promo_noise = rng.uniform(-0.08, 0.08, N_ROWS)
promotion_suggestion = np.where(promo_score + promo_noise > 0.45, "YES", "NO")

# price_adjustment: INCREASE when demand high + good margin; DECREASE when demand low + high abandon
price_score = (
    demand_score * 0.40
    + price_competitiveness_score * 0.25
    + margin_pct * 0.20
    - cart_abandonment_rate * 0.15
)
price_noise = rng.uniform(-0.06, 0.06, N_ROWS)
ps = price_score + price_noise
price_adjustment = np.where(ps > 0.65, "INCREASE",
                   np.where(ps < 0.35, "DECREASE", "STABLE"))

df = pd.DataFrame({
    "product_id":                  product_ids,
    "shop_id":                     shop_ids,
    "category":                    categories,
    "cost_price":                  cost_price,
    "unit_price":                  unit_price,
    "stock":                       stock,
    "sales_volume":                sales_volume,
    "return_rate":                 return_rate,
    "profit":                      profit,
    "demand_score":                demand_score,
    "price_competitiveness_score": price_competitiveness_score,
    "cart_abandonment_rate":       cart_abandonment_rate,
    "loyalty_score":               loyalty_score,
    "shop_performance_index":      shop_performance_index,
    "promotion_suggestion":        promotion_suggestion,
    "price_adjustment":            price_adjustment,
})

# Merge with existing CSV if present (keeps real data)
if os.path.exists(DATASET_PATH):
    existing = pd.read_csv(DATASET_PATH)
    existing = existing.dropna(subset=["promotion_suggestion", "price_adjustment"])
    # Normalise price_adjustment: map HOLD → STABLE
    existing["price_adjustment"] = existing["price_adjustment"].replace("HOLD", "STABLE")
    df = pd.concat([existing, df], ignore_index=True)
    print(f"   Merged with existing CSV → {len(df):,} total rows")

df.to_csv(DATASET_PATH, index=False)
print(f"✅ Dataset saved: {DATASET_PATH}  ({len(df):,} rows)")

# ── 2. Feature engineering ─────────────────────────────────────────────────────
print("\n🧠 Engineering features …")

df = df.dropna(subset=["promotion_suggestion", "price_adjustment"])
df["cost_price"]            = pd.to_numeric(df["cost_price"], errors="coerce").fillna(df["unit_price"] * 0.5)
df["return_rate"]           = pd.to_numeric(df["return_rate"], errors="coerce").fillna(df["return_rate"].median())
df["cart_abandonment_rate"] = pd.to_numeric(df["cart_abandonment_rate"], errors="coerce").fillna(df["cart_abandonment_rate"].median())
df["stock"]                 = pd.to_numeric(df["stock"], errors="coerce").fillna(0).clip(lower=0)
df["profit"]                = pd.to_numeric(df["profit"], errors="coerce").fillna(0).clip(lower=-50_000, upper=500_000)

df["margin_pct"]           = (df["unit_price"] - df["cost_price"]) / df["unit_price"].replace(0, np.nan)
df["revenue"]              = df["unit_price"] * df["sales_volume"]
df["stock_to_sales_ratio"] = df["stock"] / (df["sales_volume"] + 1)
df["profit_per_unit"]      = df["profit"] / (df["sales_volume"] + 1)
df["price_x_demand"]       = df["unit_price"] * df["demand_score"]
df["abandon_x_loyalty"]    = df["cart_abandonment_rate"] * df["loyalty_score"]
df["perf_x_demand"]        = df["shop_performance_index"] * df["demand_score"]

le_cat = LabelEncoder()
df["category_enc"] = le_cat.fit_transform(df["category"].astype(str))

FEATURES = [
    "cost_price", "unit_price", "stock", "sales_volume",
    "return_rate", "profit", "demand_score",
    "price_competitiveness_score", "cart_abandonment_rate",
    "loyalty_score", "shop_performance_index",
    "margin_pct", "revenue", "stock_to_sales_ratio",
    "profit_per_unit", "price_x_demand", "abandon_x_loyalty",
    "perf_x_demand", "category_enc",
]

df[FEATURES] = df[FEATURES].fillna(0)
df = df.drop_duplicates().reset_index(drop=True)
print(f"   Clean rows: {len(df):,}  |  Features: {len(FEATURES)}")

# ── 3. Encode targets ──────────────────────────────────────────────────────────
le_promo = LabelEncoder()
le_price = LabelEncoder()
df["y_promo"] = le_promo.fit_transform(df["promotion_suggestion"])
df["y_price"] = le_price.fit_transform(df["price_adjustment"])

print(f"   Promo classes : {list(le_promo.classes_)}")
print(f"   Price classes : {list(le_price.classes_)}")

X = df[FEATURES]
y_promo = df["y_promo"]
y_price = df["y_price"]

X_train, X_test, yp_train, yp_test, ya_train, ya_test = train_test_split(
    X, y_promo, y_price, test_size=0.2, random_state=42, stratify=y_promo
)
print(f"   Train: {len(X_train):,}  |  Test: {len(X_test):,}")

# ── 4. Train models ────────────────────────────────────────────────────────────
print("\n🤖 Training models …")

# Promotion model — Random Forest with class balancing
rf_promo = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
rf_promo.fit(X_train, yp_train)
pred_promo = rf_promo.predict(X_test)
acc_promo  = accuracy_score(yp_test, pred_promo)
f1_promo   = f1_score(yp_test, pred_promo, average="weighted")
print(f"   ✅ Promotion  — Accuracy: {acc_promo:.4f}  F1: {f1_promo:.4f}")
print(classification_report(yp_test, pred_promo, target_names=le_promo.classes_))

# Price model — XGBoost multi-class
n_price_classes = len(le_price.classes_)
xgb_price = XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softmax",
    num_class=n_price_classes,
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1,
)
xgb_price.fit(X_train, ya_train)
pred_price = xgb_price.predict(X_test)
acc_price  = accuracy_score(ya_test, pred_price)
f1_price   = f1_score(ya_test, pred_price, average="weighted")
print(f"   ✅ Price adj  — Accuracy: {acc_price:.4f}  F1: {f1_price:.4f}")
print(classification_report(ya_test, pred_price, target_names=le_price.classes_))

# ── 5. Save artefacts ──────────────────────────────────────────────────────────
print("\n💾 Saving models …")
joblib.dump(rf_promo,  os.path.join(MODEL_DIR, "rf_promo.pkl"))
joblib.dump(xgb_price, os.path.join(MODEL_DIR, "xgb_price.pkl"))
joblib.dump(le_promo,  os.path.join(MODEL_DIR, "le_promo.pkl"))
joblib.dump(le_price,  os.path.join(MODEL_DIR, "le_price.pkl"))
joblib.dump(le_cat,    os.path.join(MODEL_DIR, "le_category.pkl"))

print(f"✅ All models saved to: {MODEL_DIR}")
print(f"\n🎉 Training complete!")
print(f"   Promotion accuracy : {acc_promo:.1%}")
print(f"   Price accuracy     : {acc_price:.1%}")
