from __future__ import annotations

from pathlib import Path
import json
import os

import joblib

from .schemas import EtaPredictionRequest, EtaPredictionResponse


MODEL_VERSION = "delivery-eta-v1"


class EtaModelService:
    def __init__(self) -> None:
        self.eta_model = self._load(os.getenv("DELIVERY_ETA_MODEL_PATH", "artifacts/eta_model.joblib"))
        self.risk_model = self._load(os.getenv("DELIVERY_RISK_MODEL_PATH", "artifacts/risk_model.joblib"))
        self.metadata = self._load_metadata(os.getenv("DELIVERY_ETA_METADATA_PATH", "artifacts/metadata.json"))

    def predict(self, payload: EtaPredictionRequest) -> EtaPredictionResponse:
        if self.eta_model and self.risk_model:
            frame = self._as_frame(payload)
            estimated = int(round(float(self.eta_model.predict(frame)[0])))
            risk = str(self.risk_model.predict(frame)[0])
            reason = self._reason(payload, risk)
            return EtaPredictionResponse(
                orderId=payload.orderId,
                estimatedMinutes=max(3, estimated),
                riskLevel=risk,
                reason=reason,
                weather=payload.weather,
                distanceKm=round(payload.distanceKm, 2),
                modelVersion=self.metadata.get("modelVersion", MODEL_VERSION),
            )

        estimated, risk, reason = self._heuristic(payload)
        return EtaPredictionResponse(
            orderId=payload.orderId,
            estimatedMinutes=estimated,
            riskLevel=risk,
            reason=reason,
            weather=payload.weather,
            distanceKm=round(payload.distanceKm, 2),
            modelVersion=f"{MODEL_VERSION}-heuristic",
        )

    def _load(self, path: str):
        file = Path(path)
        return joblib.load(file) if file.exists() else None

    def _load_metadata(self, path: str) -> dict:
        file = Path(path)
        if not file.exists():
            return {"modelVersion": f"{MODEL_VERSION}-heuristic"}
        return json.loads(file.read_text(encoding="utf-8"))

    def _as_frame(self, payload: EtaPredictionRequest):
        import pandas as pd

        return pd.DataFrame([{
            "distance_km": payload.distanceKm,
            "route_duration_min": payload.routeDurationMinutes,
            "weather": payload.weather,
            "temperature_c": payload.temperatureC,
            "wind_speed": payload.windSpeed,
            "is_rain": int(payload.isRain),
            "hour": payload.hourOfDay,
            "day_of_week": payload.dayOfWeek,
            "vehicle_type": payload.vehicleType,
        }])

    def _heuristic(self, payload: EtaPredictionRequest) -> tuple[int, str, str]:
        minutes = max(payload.routeDurationMinutes, payload.distanceKm * 4.2 + 8)
        risk_points = 0
        reasons: list[str] = []

        if payload.distanceKm >= 12:
            risk_points += 2
            reasons.append("long distance")
        elif payload.distanceKm >= 7:
            risk_points += 1
            reasons.append("medium distance")

        weather = payload.weather.lower()
        if payload.isRain or any(token in weather for token in ["rain", "storm", "thunder"]):
            risk_points += 2
            minutes *= 1.22
            reasons.append("rain")
        elif any(token in weather for token in ["mist", "fog", "snow"]):
            risk_points += 1
            minutes *= 1.12
            reasons.append(payload.weather)

        if payload.hourOfDay in (7, 8, 17, 18, 19):
            risk_points += 1
            minutes *= 1.15
            reasons.append("traffic peak")

        if payload.windSpeed >= 10:
            risk_points += 1
            minutes *= 1.08
            reasons.append("wind")

        risk = "HIGH" if risk_points >= 4 else "MEDIUM" if risk_points >= 2 else "LOW"
        return max(3, int(round(minutes))), risk, " + ".join(reasons) if reasons else "normal conditions"

    def _reason(self, payload: EtaPredictionRequest, risk: str) -> str:
        parts = []
        if payload.isRain:
            parts.append("rain")
        if payload.distanceKm >= 7:
            parts.append("long distance" if payload.distanceKm >= 12 else "medium distance")
        if payload.hourOfDay in (7, 8, 17, 18, 19):
            parts.append("traffic peak")
        if payload.windSpeed >= 10:
            parts.append("wind")
        if not parts:
            parts.append("normal conditions")
        return f"{' + '.join(parts)} ({risk.lower()} risk)"
