from pathlib import Path
import random

import pandas as pd

RAW_PATH = Path("data/raw/delivery_eta_dataset.csv")
WEATHER = ["Clear", "Clouds", "Rain", "Thunderstorm", "Mist"]
VEHICLES = ["Car", "Motorcycle", "Scooter", "Bike"]


def risk_for(row: dict) -> str:
    score = 0
    score += 2 if row["distance_km"] >= 12 else 1 if row["distance_km"] >= 7 else 0
    score += 2 if row["weather"] in ("Rain", "Thunderstorm") else 1 if row["weather"] == "Mist" else 0
    score += 1 if row["hour"] in (7, 8, 17, 18, 19) else 0
    score += 1 if row["wind_speed"] >= 10 else 0
    return "HIGH" if score >= 4 else "MEDIUM" if score >= 2 else "LOW"


def main() -> None:
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    random.seed(42)
    for _ in range(1800):
        distance = round(random.uniform(0.8, 28.0), 2)
        weather = random.choices(WEATHER, weights=[45, 25, 18, 4, 8])[0]
        hour = random.randint(6, 22)
        wind = round(random.uniform(0, 18), 1)
        vehicle = random.choice(VEHICLES)
        route_duration = distance * random.uniform(3.0, 5.8) + random.uniform(3, 10)
        multiplier = 1.0
        if weather in ("Rain", "Thunderstorm"):
            multiplier += random.uniform(0.15, 0.35)
        if weather == "Mist":
            multiplier += random.uniform(0.05, 0.18)
        if hour in (7, 8, 17, 18, 19):
            multiplier += random.uniform(0.1, 0.25)
        if vehicle in ("Bike", "Scooter"):
            multiplier += random.uniform(0.03, 0.14)
        estimated = int(round(route_duration * multiplier + random.uniform(-3, 6)))
        row = {
            "distance_km": distance,
            "route_duration_min": round(route_duration, 1),
            "weather": weather,
            "temperature_c": round(random.uniform(8, 38), 1),
            "wind_speed": wind,
            "is_rain": int(weather in ("Rain", "Thunderstorm")),
            "hour": hour,
            "day_of_week": random.randint(1, 7),
            "vehicle_type": vehicle,
            "estimated_minutes": max(3, estimated),
        }
        row["risk_level"] = risk_for(row)
        rows.append(row)

    pd.DataFrame(rows).to_csv(RAW_PATH, index=False)
    print(f"Generated {len(rows)} rows -> {RAW_PATH}")


if __name__ == "__main__":
    main()
