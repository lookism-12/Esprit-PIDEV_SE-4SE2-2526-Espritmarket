from fastapi import FastAPI

from .model import EtaModelService
from .schemas import EtaPredictionRequest, EtaPredictionResponse

app = FastAPI(title="Esprit Market Delivery ETA AI", version="1.0.0")
model_service = EtaModelService()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "delivery-eta-ai"}


@app.post("/predict", response_model=EtaPredictionResponse)
def predict(payload: EtaPredictionRequest) -> EtaPredictionResponse:
    return model_service.predict(payload)
