# ============================================================
# 🚀 EspritMarket Cart ML - Model Training Script
# ============================================================
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings("ignore")

# ============================================================
# 📂 PATHS
# ============================================================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
DATASET_PATH = os.path.join(ROOT_DIR, "ecommerce_ml_dataset.csv")
MODEL_DIR    = os.path.join(ROOT_DIR, "models")

os.makedirs(MODEL_DIR, exist_ok=True)

# ============================================================
# 📂 LOAD DATASET
# ============================================================
print("📂 Loading dataset from:", DATASET_PATH)
df = pd.read_csv(DATASET_PATH)
print(f"✅ Loaded {len(df)} records")
print(f"   Columns: {list(df.columns)}")

# ============================================================
# 🧹 CLEANING
# ============================================================
print("\n🧹 Cleaning data...")
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df["cost_price"]           = df["cost_price"].fillna(df["unit_price"] * 0.5)
df["return_rate"]          = df["return_rate"].fillna(df["return_rate"].median())
df["cart_abandonment_rate"]= df["cart_abandonment_rate"].fillna(df["cart_abandonment_rate"].median())
df["stock"]                = df["stock"].clip(lower=0)
df["profit"]               = df["profit"].clip(lower=-50000, upper=500000)
df = df.drop_duplicates().reset_index(drop=True)
print(f"✅ Cleaned: {len(df)} records remaining")

# ============================================================
# 🧠 FEATURE ENGINEERING
# ============================================================
print("\n🧠 Engineering features...")
df["margin_pct"]          = (df["unit_price"] - df["cost_price"]) / df["unit_price"].replace(0, np.nan)
df["revenue"]             = df["unit_price"] * df["sales_volume"]
df["stock_to_sales_ratio"]= df["stock"] / (df["sales_volume"] + 1)
df["profit_per_unit"]     = df["profit"] / (df["sales_volume"] + 1)
df["price_x_demand"]      = df["unit_price"] * df["demand_score"]
df["abandon_x_loyalty"]   = df["cart_abandonment_rate"] * df["loyalty_score"]
df["perf_x_demand"]       = df["shop_performance_index"] * df["demand_score"]

# Encode category
le_cat = LabelEncoder()
df["category_enc"] = le_cat.fit_transform(df["category"])

FEATURES = [
    "cost_price", "unit_price", "stock", "sales_volume",
    "return_rate", "profit", "demand_score",
    "price_competitiveness_score", "cart_abandonment_rate",
    "loyalty_score", "shop_performance_index",
    "margin_pct", "revenue", "stock_to_sales_ratio",
    "profit_per_unit", "price_x_demand", "abandon_x_loyalty",
    "perf_x_demand", "category_enc"
]

# Fill any NaN from feature engineering
df[FEATURES] = df[FEATURES].fillna(0)
print(f"✅ Created {len(FEATURES)} features")

# ============================================================
# 🎯 ENCODE TARGETS
# ============================================================
print("\n🎯 Encoding targets...")
print(f"   promotion_suggestion values: {df['promotion_suggestion'].unique()}")
print(f"   price_adjustment values:     {df['price_adjustment'].unique()}")

le_promo = LabelEncoder()
le_price = LabelEncoder()

df["y_promo"] = le_promo.fit_transform(df["promotion_suggestion"])
df["y_price"] = le_price.fit_transform(df["price_adjustment"])

N_PRICE_CLASSES = len(le_price.classes_)
print(f"✅ Promotion classes: {le_promo.classes_}")
print(f"✅ Price classes:     {le_price.classes_}")

# ============================================================
# ✂️ SPLIT DATA
# ============================================================
print("\n✂️ Splitting data (80/20)...")
X = df[FEATURES]
y_promo = df["y_promo"]
y_price = df["y_price"]

X_train, X_test, yp_train, yp_test, ya_train, ya_test = train_test_split(
    X, y_promo, y_price, test_size=0.2, random_state=42
)
print(f"✅ Train: {len(X_train)}, Test: {len(X_test)}")

# ============================================================
# 🤖 TRAIN MODELS
# ============================================================
print("\n🤖 Training models...")

print("  📊 Training Promotion model (Random Forest)...")
rf_promo = RandomForestClassifier(
    n_estimators=150, max_depth=10,
    class_weight="balanced", random_state=42, n_jobs=-1
)
rf_promo.fit(X_train, yp_train)
print("  ✅ Done")

print("  📊 Training Price Adjustment model (XGBoost)...")
xgb_price = XGBClassifier(
    n_estimators=200, max_depth=5, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    objective="multi:softmax", num_class=N_PRICE_CLASSES,
    eval_metric="mlogloss", random_state=42
)
xgb_price.fit(X_train, ya_train)
print("  ✅ Done")

# ============================================================
# 📊 EVALUATION
# ============================================================
print("\n📊 Evaluating models...")
pred_promo = rf_promo.predict(X_test)
pred_price = xgb_price.predict(X_test)

acc_promo = accuracy_score(yp_test, pred_promo)
acc_price = accuracy_score(ya_test, pred_price)

print(f"\n{'='*50}")
print(f"🎯 PROMOTION ACCURACY: {acc_promo:.4f} ({acc_promo:.1%})")
print(classification_report(yp_test, pred_promo, target_names=le_promo.classes_))

print(f"{'='*50}")
print(f"💰 PRICE ACCURACY: {acc_price:.4f} ({acc_price:.1%})")
print(classification_report(ya_test, pred_price, target_names=le_price.classes_))

# ============================================================
# 💾 SAVE MODELS
# ============================================================
print("\n💾 Saving models...")
joblib.dump(rf_promo,  os.path.join(MODEL_DIR, "rf_promo.pkl"))
joblib.dump(xgb_price, os.path.join(MODEL_DIR, "xgb_price.pkl"))
joblib.dump(le_promo,  os.path.join(MODEL_DIR, "le_promo.pkl"))
joblib.dump(le_price,  os.path.join(MODEL_DIR, "le_price.pkl"))
joblib.dump(le_cat,    os.path.join(MODEL_DIR, "le_category.pkl"))

print(f"✅ All models saved to: {MODEL_DIR}")
print("\n🎉 Training complete!")
print(f"   Promotion: {acc_promo:.1%}")
print(f"   Price:     {acc_price:.1%}")
