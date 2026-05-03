"""
Carpooling dataset generator — realistic Tunisian market data.

Key realism fixes vs old version:
- Distances based on real Tunisian city pairs (5–250 km)
- Fare range: 0.15–0.55 TND/km (Tunisian carpooling market rate)
- Cost model: 0.30 TND/km base (fuel + wear for Tunisian cars)
- Night surcharge: +0.08 TND/km
- Weekend surcharge: +0.04 TND/km
- Passenger rating has strong influence (< 3.5 = big penalty)
- Pickup detour > 8 km is a deal-breaker
- Seat count affects profitability (more seats = more revenue)
- Consistent cost model between generator and trainer
"""

import pandas as pd
import numpy as np
import os
import random

random.seed(42)
np.random.seed(42)

# ── Realistic Tunisian city-pair distances (km) ───────────────────────────────
CITY_PAIRS = [
    ("Tunis", "Ariana",          12),
    ("Tunis", "Ben Arous",       15),
    ("Tunis", "La Marsa",        20),
    ("Tunis", "Sousse",         140),
    ("Tunis", "Sfax",           270),
    ("Tunis", "Nabeul",          80),
    ("Tunis", "Bizerte",         65),
    ("Tunis", "Zaghouan",        55),
    ("Tunis", "Hammamet",        65),
    ("Tunis", "Monastir",       160),
    ("Tunis", "Mahdia",         200),
    ("Tunis", "Kairouan",       155),
    ("Tunis", "Gafsa",          340),
    ("Tunis", "Gabes",          400),
    ("Tunis", "Djerba",         500),
    ("Sousse", "Monastir",       20),
    ("Sousse", "Sfax",          130),
    ("Sousse", "Kairouan",       55),
    ("Sousse", "Hammamet",       75),
    ("Sfax", "Gabes",           130),
    ("Sfax", "Gafsa",           130),
    ("Sfax", "Mahdia",           70),
    ("Nabeul", "Hammamet",       12),
    ("Nabeul", "Sousse",         90),
    ("Bizerte", "Tunis",         65),
    ("Bizerte", "Nabeul",       110),
    ("Kairouan", "Sfax",        130),
    ("Kairouan", "Sousse",       55),
    ("Gabes", "Djerba",          75),
    ("Gabes", "Gafsa",          120),
    ("Ariana", "La Marsa",       10),
    ("Ariana", "Sousse",        145),
    ("Ben Arous", "Tunis",       15),
    ("Manouba", "Tunis",         12),
    ("Manouba", "Bizerte",       70),
    ("Zaghouan", "Sousse",      100),
    ("Zaghouan", "Kairouan",    100),
    ("Jendouba", "Tunis",       155),
    ("Jendouba", "Bizerte",     120),
    ("Beja", "Tunis",           105),
    ("Siliana", "Tunis",        130),
    ("Le Kef", "Tunis",         175),
    ("Kasserine", "Tunis",      250),
    ("Sidi Bouzid", "Sfax",     120),
    ("Tozeur", "Gafsa",          90),
    ("Kebili", "Gabes",         100),
    ("Tataouine", "Gabes",      170),
    ("Medenine", "Gabes",        75),
    ("Medenine", "Djerba",       50),
]

TIMES_OF_DAY = ["morning", "afternoon", "evening", "night"]
GENDERS      = ["MALE", "FEMALE", "OTHER"]

# ── Cost model (must match train_carpooling.py exactly) ───────────────────────
BASE_COST_PER_KM   = 0.30   # TND/km (fuel + wear for average Tunisian car)
NIGHT_SURCHARGE    = 0.08
WEEKEND_SURCHARGE  = 0.04


def _driver_decision(
    ride_km: float,
    pickup_km: float,
    fare: float,
    seats: int,
    rating: float,
    time_of_day: str,
    is_weekend: int,
    has_pets: int,
) -> str:
    total_km = ride_km + pickup_km
    fare_per_km = fare / (ride_km + 0.1)

    cost = BASE_COST_PER_KM
    if time_of_day == "night":
        cost += NIGHT_SURCHARGE
    if is_weekend:
        cost += WEEKEND_SURCHARGE

    net_profit    = fare - total_km * cost
    profit_per_km = net_profit / (total_km + 0.1)

    # ── Base probability from profit per km ───────────────────────────────────
    if profit_per_km > 0.35:
        prob = 0.96
    elif profit_per_km > 0.20:
        prob = 0.88
    elif profit_per_km > 0.10:
        prob = 0.75
    elif profit_per_km > 0.02:
        prob = 0.55
    elif profit_per_km > -0.05:
        prob = 0.28
    elif profit_per_km > -0.15:
        prob = 0.10
    else:
        prob = 0.03

    # ── Adjustments ───────────────────────────────────────────────────────────
    # Passenger rating
    if rating >= 4.7:
        prob += 0.12
    elif rating >= 4.0:
        prob += 0.06
    elif rating < 3.5:
        prob -= 0.18
    elif rating < 3.0:
        prob -= 0.30

    # Pickup detour penalty
    detour_ratio = pickup_km / (ride_km + 0.1)
    if detour_ratio > 0.30:
        prob -= 0.20
    elif detour_ratio > 0.15:
        prob -= 0.10

    # Pets are a deal-breaker for many drivers
    if has_pets:
        prob -= 0.15

    # More seats = more revenue (slight boost)
    if seats >= 3:
        prob += 0.05

    # Night rides: drivers are more selective
    if time_of_day == "night":
        prob -= 0.08

    # Short rides (< 10 km) are less attractive
    if ride_km < 10:
        prob -= 0.10

    return "ACCEPT" if random.random() < max(0.01, min(0.99, prob)) else "REJECT"


def generate_carpooling_dataset(num_samples: int = 8000) -> None:
    data = []

    for i in range(num_samples):
        # Pick a random city pair
        pair = random.choice(CITY_PAIRS)
        base_distance = pair[2]
        # Add ±20% noise to the base distance
        ride_km = round(base_distance * random.uniform(0.80, 1.20), 1)

        pickup_km    = round(random.uniform(0.3, 12.0), 1)
        requested    = random.randint(1, 4)
        time_of_day  = random.choice(TIMES_OF_DAY)
        is_weekend   = 1 if random.random() < 0.28 else 0
        has_luggage  = 1 if random.random() < 0.35 else 0
        has_pets     = 1 if random.random() < 0.08 else 0
        p_gender     = random.choice(GENDERS)
        d_gender     = random.choice(GENDERS)
        rating       = round(random.uniform(1.0, 5.0), 1)

        # Fare: realistic Tunisian range 0.15–0.55 TND/km per seat
        fare_per_km_per_seat = random.uniform(0.15, 0.55)
        fare = round(ride_km * fare_per_km_per_seat * requested, 2)
        # Clamp to reasonable range
        fare = max(2.0, min(fare, 150.0))

        decision = _driver_decision(
            ride_km, pickup_km, fare, requested,
            rating, time_of_day, is_weekend, has_pets
        )

        data.append({
            "request_id":         f"REQ_{i:05d}",
            "ride_distance_km":   ride_km,
            "pickup_distance_km": pickup_km,
            "fare_offered":       fare,
            "requested_seats":    requested,
            "available_seats":    4,
            "passenger_rating":   rating,
            "time_of_day":        time_of_day,
            "is_weekend":         is_weekend,
            "has_luggage":        has_luggage,
            "has_pets":           has_pets,
            "passenger_gender":   p_gender,
            "driver_gender":      d_gender,
            "driver_decision":    decision,
        })

    df = pd.DataFrame(data)
    accept_rate = (df["driver_decision"] == "ACCEPT").mean()
    print(f"Generated {num_samples} samples — accept rate: {accept_rate:.1%}")

    os.makedirs("../datasets", exist_ok=True)
    df.to_csv("../datasets/carpooling_dataset.csv", index=False)
    print("Saved → ../datasets/carpooling_dataset.csv")


if __name__ == "__main__":
    generate_carpooling_dataset()
