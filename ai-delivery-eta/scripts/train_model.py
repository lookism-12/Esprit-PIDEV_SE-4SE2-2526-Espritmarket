from pathlib import Path
import json

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

CLEAN_PATH = Path("data/cleaned/delivery_eta_dataset_clean.csv")
ARTIFACTS = Path("artifacts")
FEATURES = [
    "distance_km", "route_duration_min", "weather", "temperature_c", "wind_speed",
    "is_rain", "hour", "day_of_week", "vehicle_type",
]
CATEGORICAL = ["weather", "vehicle_type"]
NUMERIC = [feature for feature in FEATURES if feature not in CATEGORICAL]


def main() -> None:
    if not CLEAN_PATH.exists():
        raise SystemExit("Run scripts/clean_dataset.py first.")

    df = pd.read_csv(CLEAN_PATH)
    x = df[FEATURES]
    y_eta = df["estimated_minutes"]
    y_risk = df["risk_level"]

    x_train, x_test, eta_train, eta_test, risk_train, risk_test = train_test_split(
        x, y_eta, y_risk, test_size=0.2, random_state=42, stratify=y_risk
    )
    preprocessor = ColumnTransformer([
        ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
        ("numeric", "passthrough", NUMERIC),
    ])
    eta_model = Pipeline([
        ("features", preprocessor),
        ("model", RandomForestRegressor(n_estimators=120, random_state=42, min_samples_leaf=3)),
    ])
    risk_model = Pipeline([
        ("features", preprocessor),
        ("model", RandomForestClassifier(n_estimators=120, random_state=42, min_samples_leaf=3)),
    ])

    eta_model.fit(x_train, eta_train)
    risk_model.fit(x_train, risk_train)

    eta_pred = eta_model.predict(x_test)
    risk_pred = risk_model.predict(x_test)

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(eta_model, ARTIFACTS / "eta_model.joblib")
    joblib.dump(risk_model, ARTIFACTS / "risk_model.joblib")
    metadata = {
        "modelVersion": "delivery-eta-v1",
        "maeMinutes": round(float(mean_absolute_error(eta_test, eta_pred)), 2),
        "riskAccuracy": round(float(accuracy_score(risk_test, risk_pred)), 3),
        "features": FEATURES,
    }
    (ARTIFACTS / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(metadata)


if __name__ == "__main__":
    main()
