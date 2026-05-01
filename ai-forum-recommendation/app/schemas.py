from pydantic import BaseModel, Field


class ForumRecommendationRequest(BaseModel):
    post_id: str | None = None
    content: str = Field(min_length=1)
    category_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class ForumRecommendedPost(BaseModel):
    post_id: str
    title: str
    excerpt: str
    content: str
    category_id: str | None = None
    category: str | None = None
    score: float
    source: str


class ForumRecommendationResponse(BaseModel):
    post_id: str | None = None
    recommendations: list[ForumRecommendedPost]
    total_count: int
    algorithm_used: str
    generated_at: str


class ReindexResponse(BaseModel):
    status: str
    indexed_count: int
    source: str
    algorithm_used: str
