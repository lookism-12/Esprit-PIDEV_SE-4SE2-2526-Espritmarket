from pathlib import Path

import pandas as pd

RAW_PATH = Path("data/raw/delivery_eta_dataset.csv")
CLEAN_PATH = Path("data/cleaned/delivery_eta_dataset_clean.csv")


def main() -> None:
    if not RAW_PATH.exists():
        raise SystemExit("Run scripts/generate_dataset.py first.")

    df = pd.read_csv(RAW_PATH)
    df = df.drop_duplicates()
    df["weather"] = df["weather"].fillna("Clear").astype(str).str.strip().str.title()
    df["vehicle_type"] = df["vehicle_type"].fillna("Car").astype(str).str.strip().str.title()
    numeric = [
        "distance_km", "route_duration_min", "temperature_c", "wind_speed",
        "is_rain", "hour", "day_of_week", "estimated_minutes",
    ]
    for column in numeric:
        df[column] = pd.to_numeric(df[column], errors="coerce")
        df[column] = df[column].fillna(df[column].median())

    df = df[(df["distance_km"] >= 0) & (df["estimated_minutes"] >= 1)]
    CLEAN_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CLEAN_PATH, index=False)
    print(f"Cleaned {len(df)} rows -> {CLEAN_PATH}")


if __name__ == "__main__":
    main()
