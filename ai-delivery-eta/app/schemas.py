from pydantic import BaseModel, Field


class EtaPredictionRequest(BaseModel):
    orderId: str
    distanceKm: float = Field(ge=0)
    routeDurationMinutes: float = Field(ge=0)
    weather: str = "Clear"
    temperatureC: float = 20.0
    windSpeed: float = 0.0
    isRain: bool = False
    hourOfDay: int = Field(default=12, ge=0, le=23)
    dayOfWeek: int = Field(default=1, ge=1, le=7)
    vehicleType: str = "Car"


class EtaPredictionResponse(BaseModel):
    orderId: str
    estimatedMinutes: int
    riskLevel: str
    reason: str
    weather: str
    distanceKm: float
    modelVersion: str
