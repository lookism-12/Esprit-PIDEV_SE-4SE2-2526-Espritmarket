from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import csv
import os
from typing import Any

import numpy as np
import pandas as pd

from .schemas import (
    ForumRecommendationRequest,
    ForumRecommendationResponse,
    ForumRecommendedPost,
    ReindexResponse,
)

try:
    import faiss  # type: ignore
except Exception:
    faiss = None

try:
    from pymongo import MongoClient
except Exception:
    MongoClient = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except Exception:
    TfidfVectorizer = None
    cosine_similarity = None


MODEL_VERSION = "forum-recommendation-v1"


@dataclass
class IndexedPost:
    post_id: str
    title: str
    content: str
    category_id: str | None
    category: str | None
    likes: int
    source: str

    @property
    def search_text(self) -> str:
        parts = [self.title, self.content, self.category or ""]
        return " ".join(part for part in parts if part).strip()

    @property
    def excerpt(self) -> str:
        text = self.content.replace("\n", " ").strip()
        return text[:220] + "..." if len(text) > 220 else text


class ForumRecommendationService:
    def __init__(self) -> None:
        default_artifact_dir = Path(__file__).resolve().parents[1] / "artifacts"
        self.artifact_dir = Path(os.getenv("FORUM_AI_ARTIFACT_DIR", str(default_artifact_dir)))
        self.mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/esprit_market")
        self.mongo_database = os.getenv("MONGODB_DATABASE", "esprit_market")
        self.embedding_model_name = os.getenv(
            "FORUM_AI_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        )
        self.posts: list[IndexedPost] = []
        self.backend = "none"
        self.source = "none"
        self.embedding_model = None
        self.faiss_index = None
        self.embedding_matrix: np.ndarray | None = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self.last_error: str | None = None
        self.reindex()

    def health(self) -> dict:
        return {
            "status": "ok" if self.posts else "degraded",
            "service": "forum-recommendation-ai",
            "indexed_count": len(self.posts),
            "source": self.source,
            "algorithm_used": self.backend,
            "last_error": self.last_error,
        }

    def reindex(self) -> ReindexResponse:
        self.last_error = None
        mongo_posts = self._load_mongo_posts()
        if mongo_posts:
            self._build_index(mongo_posts, source="mongodb")
        else:
            fallback_posts = self._load_dataset_posts()
            self._build_index(fallback_posts, source="dataset")

        return ReindexResponse(
            status="ok" if self.posts else "empty",
            indexed_count=len(self.posts),
            source=self.source,
            algorithm_used=self.backend,
        )

    def recommend(self, payload: ForumRecommendationRequest) -> ForumRecommendationResponse:
        if not self.posts:
            self.reindex()

        recommendations: list[ForumRecommendedPost] = []
        if self.posts and payload.content.strip():
            recommendations = self._rank(payload)

        return ForumRecommendationResponse(
            post_id=payload.post_id,
            recommendations=recommendations[: payload.top_k],
            total_count=len(recommendations[: payload.top_k]),
            algorithm_used=self.backend,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def _build_index(self, posts: list[IndexedPost], source: str) -> None:
        self.posts = posts
        self.source = source if posts else "none"
        self.backend = "none"
        self.faiss_index = None
        self.embedding_matrix = None
        self.vectorizer = None
        self.tfidf_matrix = None

        if not posts:
            return

        texts = [post.search_text for post in posts]
        if source == "dataset" and self._load_precomputed_dense_index():
            return
        if self._build_sentence_index(texts):
            return
        if self._build_tfidf_index(texts):
            return
        self.backend = "keyword-fallback"

    def _build_sentence_index(self, texts: list[str]) -> bool:
        if SentenceTransformer is None:
            self.last_error = "sentence-transformers is not installed"
            return False

        try:
            if self.embedding_model is None:
                self.embedding_model = SentenceTransformer(self.embedding_model_name)
            embeddings = self.embedding_model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            ).astype("float32")

            if faiss is not None:
                index = faiss.IndexFlatIP(embeddings.shape[1])
                index.add(embeddings)
                self.faiss_index = index
                self.embedding_matrix = embeddings
                self.backend = f"{MODEL_VERSION}-faiss-minilm"
                return True

            self.embedding_matrix = embeddings
            self.backend = f"{MODEL_VERSION}-numpy-minilm"
            return True
        except Exception as exc:
            self.last_error = f"MiniLM index failed: {exc}"
            return False

    def _load_precomputed_dense_index(self) -> bool:
        if SentenceTransformer is None:
            self.last_error = "sentence-transformers is not installed"
            return False

        try:
            if self.embedding_model is None:
                self.embedding_model = SentenceTransformer(self.embedding_model_name)

            index_path = self.artifact_dir / "faiss_index.bin"
            embeddings_path = self.artifact_dir / "embeddings.npy"

            if faiss is not None and index_path.exists():
                index = faiss.read_index(str(index_path))
                if index.ntotal == len(self.posts):
                    self.faiss_index = index
                    self.backend = f"{MODEL_VERSION}-precomputed-faiss"
                    return True

            if embeddings_path.exists():
                embeddings = np.load(embeddings_path).astype("float32")
                if len(embeddings) == len(self.posts):
                    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
                    norms[norms == 0] = 1.0
                    self.embedding_matrix = embeddings / norms
                    self.backend = f"{MODEL_VERSION}-precomputed-numpy"
                    return True
        except Exception as exc:
            self.last_error = f"Precomputed dense index failed: {exc}"
        return False

    def _build_tfidf_index(self, texts: list[str]) -> bool:
        if TfidfVectorizer is None:
            return False
        try:
            self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=20000)
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)
            self.backend = f"{MODEL_VERSION}-tfidf"
            return True
        except Exception as exc:
            self.last_error = f"TF-IDF index failed: {exc}"
            return False

    def _rank(self, payload: ForumRecommendationRequest) -> list[ForumRecommendedPost]:
        candidates = self._score_candidates(payload.content)
        ranked: list[tuple[IndexedPost, float]] = []
        excluded_id = str(payload.post_id) if payload.post_id else None

        for idx, score in candidates:
            if idx < 0 or idx >= len(self.posts):
                continue
            post = self.posts[idx]
            if excluded_id and post.post_id == excluded_id:
                continue
            adjusted = float(score)
            if payload.category_id and post.category_id == payload.category_id:
                adjusted = min(1.0, adjusted + 0.05)
            ranked.append((post, adjusted))

        ranked.sort(key=lambda item: (item[1], item[0].likes), reverse=True)
        seen: set[str] = set()
        output: list[ForumRecommendedPost] = []
        for post, score in ranked:
            if post.post_id in seen:
                continue
            seen.add(post.post_id)
            output.append(
                ForumRecommendedPost(
                    post_id=post.post_id,
                    title=post.title,
                    excerpt=post.excerpt,
                    content=post.content,
                    category_id=post.category_id,
                    category=post.category,
                    score=round(max(0.0, min(1.0, score)), 4),
                    source=post.source,
                )
            )
        return output

    def _score_candidates(self, text: str) -> list[tuple[int, float]]:
        limit = min(len(self.posts), 50)
        if self.faiss_index is not None and self.embedding_model is not None:
            query = self.embedding_model.encode(
                [text], convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False
            ).astype("float32")
            scores, indexes = self.faiss_index.search(query, limit)
            return [(int(idx), float(score)) for idx, score in zip(indexes[0], scores[0]) if idx >= 0]

        if self.embedding_matrix is not None and self.embedding_model is not None:
            query = self.embedding_model.encode(
                [text], convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False
            ).astype("float32")
            scores = np.dot(self.embedding_matrix, query[0])
            indexes = np.argsort(scores)[::-1][:limit]
            return [(int(idx), float(scores[idx])) for idx in indexes]

        if self.vectorizer is not None and self.tfidf_matrix is not None and cosine_similarity is not None:
            query = self.vectorizer.transform([text])
            scores = cosine_similarity(query, self.tfidf_matrix)[0]
            indexes = np.argsort(scores)[::-1][:limit]
            return [(int(idx), float(scores[idx])) for idx in indexes]

        query_terms = set(text.lower().split())
        scored = []
        for idx, post in enumerate(self.posts):
            terms = set(post.search_text.lower().split())
            overlap = len(query_terms.intersection(terms))
            denom = max(1, len(query_terms.union(terms)))
            scored.append((idx, overlap / denom))
        return sorted(scored, key=lambda item: item[1], reverse=True)[:limit]

    def _load_mongo_posts(self) -> list[IndexedPost]:
        if MongoClient is None:
            self.last_error = "pymongo is not installed"
            return []

        try:
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2500)
            db = client[self.mongo_database]
            client.admin.command("ping")

            categories = {
                str(category.get("_id")): category.get("name")
                for category in db["category_forum"].find({}, {"name": 1})
            }
            posts: list[IndexedPost] = []
            cursor = db["posts"].find({}, {"content": 1, "categoryId": 1, "reactionIds": 1, "createdAt": 1})
            for doc in cursor:
                content = str(doc.get("content") or "").strip()
                if not content:
                    continue
                title, body = self._split_title(content)
                category_id = str(doc.get("categoryId")) if doc.get("categoryId") is not None else None
                posts.append(
                    IndexedPost(
                        post_id=str(doc.get("_id")),
                        title=title,
                        content=body,
                        category_id=category_id,
                        category=categories.get(category_id or ""),
                        likes=len(doc.get("reactionIds") or []),
                        source="mongodb",
                    )
                )
            client.close()
            return posts
        except Exception as exc:
            self.last_error = f"MongoDB load failed: {exc}"
            return []

    def _load_dataset_posts(self) -> list[IndexedPost]:
        dataset_path = self.artifact_dir / "forum_dataset_v2.xlsx"
        if not dataset_path.exists():
            self.last_error = f"Dataset not found: {dataset_path}"
            return []

        try:
            frame = pd.read_excel(dataset_path)
            rows: list[dict[str, Any]]
            if len(frame.columns) == 1 and "," in str(frame.columns[0]):
                header = str(frame.columns[0]).split(",")
                rows = []
                for value in frame.iloc[:, 0].dropna().astype(str):
                    parsed = next(csv.reader([value]))
                    if len(parsed) == len(header):
                        rows.append(dict(zip(header, parsed)))
            else:
                rows = frame.to_dict(orient="records")

            posts = []
            for row in rows:
                title = str(row.get("title") or "").strip()
                content = str(row.get("content") or title).strip()
                posts.append(
                    IndexedPost(
                        post_id=str(row.get("postId")),
                        title=title or content[:80],
                        content=content,
                        category_id=None,
                        category=str(row.get("category") or "").strip() or None,
                        likes=self._safe_int(row.get("likes")),
                        source="dataset",
                    )
                )
            return [post for post in posts if post.content]
        except Exception as exc:
            self.last_error = f"Dataset load failed: {exc}"
            return []

    def _split_title(self, content: str) -> tuple[str, str]:
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        if not lines:
            return "Untitled discussion", ""
        if len(lines) == 1:
            return lines[0][:120], lines[0]
        return lines[0][:160], "\n".join(lines[1:]).strip()

    def _safe_int(self, value: Any) -> int:
        try:
            return int(value)
        except Exception:
            return 0
