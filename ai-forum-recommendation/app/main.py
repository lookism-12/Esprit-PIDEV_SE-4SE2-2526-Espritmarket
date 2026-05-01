from fastapi import FastAPI

from .model import ForumRecommendationService
from .schemas import ForumRecommendationRequest, ForumRecommendationResponse, ReindexResponse

app = FastAPI(title="Esprit Market Forum Recommendation AI", version="1.0.0")
model_service = ForumRecommendationService()


@app.get("/")
def root() -> dict:
    return {
        "service": "forum-recommendation-ai",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict:
    return model_service.health()


@app.post("/recommend", response_model=ForumRecommendationResponse)
def recommend(payload: ForumRecommendationRequest) -> ForumRecommendationResponse:
    return model_service.recommend(payload)


@app.post("/admin/reindex", response_model=ReindexResponse)
def reindex() -> ReindexResponse:
    return model_service.reindex()
