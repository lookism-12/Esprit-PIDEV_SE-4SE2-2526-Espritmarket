"""
EspritMarket — Marketplace Recommendation Engine
=================================================
Collaborative filtering + popularity + category affinity.

Signals used (in order of weight):
  purchase  → 5.0  (from order_items at startup + live feedback)
  cart      → 3.0  (from cart_items at startup + live feedback)
  like      → 2.0  (live feedback only)
  view      → 1.0  (live feedback only)

Endpoints consumed by Spring Boot RecommendationService:
  GET  /recommend/{user_id}?top_k=5
  POST /feedback?user_id=&product_id=&action=
  GET  /health
  POST /refresh   (reload product catalogue + history from MongoDB)
"""

from __future__ import annotations

import os
import json
import math
import random
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Optional MongoDB ──────────────────────────────────────────────────────────
try:
    from pymongo import MongoClient
    _MONGO_OK = True
except ImportError:
    _MONGO_OK = False

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EspritMarket Marketplace Recommendation API",
    description="Personalised product recommendations via collaborative filtering",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
MONGO_URI      = os.getenv("MONGODB_URI",
    "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/"
    "esprit_market?retryWrites=true&w=majority")
MONGO_DB       = os.getenv("MONGODB_DATABASE", "esprit_market")
DATA_DIR       = Path(__file__).parent
INTERACTIONS_F = DATA_DIR / "marketplace_interactions.json"

# Action weights — higher = stronger signal
ACTION_WEIGHT: dict[str, float] = {
    "view":           1.0,
    "like":           2.0,
    "cart":           3.0,
    "add_to_cart":    3.0,
    "purchase":       5.0,
}

# ── In-memory state ───────────────────────────────────────────────────────────
# interactions[user_id][product_id] = cumulative weighted score
interactions: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
# product metadata: product_id → {name, category, price}
product_meta: dict[str, dict[str, Any]] = {}
# popularity: product_id → total interaction score across all users
popularity: dict[str, float] = defaultdict(float)
# category affinity: user_id → {category_name → score}
category_affinity: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

_initialized = False


# ── Persistence helpers ───────────────────────────────────────────────────────

def _save_interactions() -> None:
    """Persist live interactions to disk so they survive restarts."""
    try:
        with open(INTERACTIONS_F, "w") as f:
            json.dump({
                "interactions": {u: dict(p) for u, p in interactions.items()},
                "product_meta":  product_meta,
            }, f)
    except Exception as e:
        print(f"[WARN] Could not save interactions: {e}")


def _load_interactions() -> None:
    """Load previously persisted live interactions from disk."""
    if not INTERACTIONS_F.exists():
        return
    try:
        with open(INTERACTIONS_F) as f:
            data = json.load(f)
        for u, prods in data.get("interactions", {}).items():
            for p, s in prods.items():
                interactions[u][p] = s
                popularity[p] += s
        product_meta.update(data.get("product_meta", {}))
        print(f"[INFO] Loaded {len(interactions)} users, "
              f"{len(product_meta)} products from disk cache")
    except Exception as e:
        print(f"[WARN] Could not load interactions: {e}")


# ── MongoDB bootstrap ─────────────────────────────────────────────────────────

def _bootstrap_from_mongo() -> bool:
    """
    Seed the recommender with real data from MongoDB:
      1. Products (APPROVED only) with resolved category names
      2. Purchase history from order_items (weight=5)
      3. Cart history from cart_items (weight=3) — implicit interest signal
    Returns True if at least one product was loaded.
    """
    if not _MONGO_OK:
        print("[WARN] pymongo not installed — skipping MongoDB bootstrap")
        return False
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[MONGO_DB]
        client.admin.command("ping")

        # ── 1. Category id → name map ─────────────────────────────────────────
        cat_map: dict[str, str] = {}
        for cat in db["categories"].find({}, {"name": 1}):
            cat_map[str(cat["_id"])] = cat.get("name", "")

        # ── 2. Load APPROVED products ─────────────────────────────────────────
        loaded_products = 0
        for doc in db["products"].find(
            {"status": "APPROVED"},
            {"name": 1, "price": 1, "categoryIds": 1}
        ):
            pid = str(doc["_id"])
            cat_ids = doc.get("categoryIds", [])
            category = ""
            if cat_ids:
                first_id = str(cat_ids[0])
                category = cat_map.get(first_id, "")
            product_meta[pid] = {
                "name":     doc.get("name", "Product"),
                "price":    float(doc.get("price") or 0),
                "category": category,
            }
            loaded_products += 1

        print(f"[INFO] Loaded {loaded_products} approved products from MongoDB")

        if loaded_products == 0:
            client.close()
            return False

        # ── 3. Purchase history from order_items ──────────────────────────────
        purchase_count = 0
        # Build order_id → user_id map from orders collection
        order_user: dict[str, str] = {}
        for order in db["orders"].find({}, {"user": 1, "userId": 1}):
            # userId may be stored as ObjectId or as a DBRef
            raw_uid = order.get("userId")
            if raw_uid is None:
                user_ref = order.get("user")
                if isinstance(user_ref, dict):
                    raw_uid = user_ref.get("$id") or user_ref.get("_id")
            if raw_uid:
                order_user[str(order["_id"])] = str(raw_uid)

        for item in db["order_items"].find({}, {"orderId": 1, "productId": 1}):
            pid = str(item.get("productId", ""))
            oid = str(item.get("orderId", ""))
            uid = order_user.get(oid, "")
            if pid and uid and pid in product_meta:
                _record(uid, pid, "purchase")
                purchase_count += 1

        print(f"[INFO] Seeded {purchase_count} purchase interactions from order history")

        # ── 4. Cart history from cart_items ───────────────────────────────────
        cart_count = 0
        # Build cart_id → user_id map from carts collection
        cart_user: dict[str, str] = {}
        for cart in db["carts"].find({}, {"userId": 1, "user": 1}):
            raw_uid = cart.get("userId")
            if raw_uid is None:
                user_ref = cart.get("user")
                if isinstance(user_ref, dict):
                    raw_uid = user_ref.get("$id") or user_ref.get("_id")
            if raw_uid:
                cart_user[str(cart["_id"])] = str(raw_uid)

        for item in db["cart_items"].find({}, {"cartId": 1, "productId": 1}):
            pid = str(item.get("productId", ""))
            cid = str(item.get("cartId", ""))
            uid = cart_user.get(cid, "")
            if pid and uid and pid in product_meta:
                _record(uid, pid, "cart")
                cart_count += 1

        print(f"[INFO] Seeded {cart_count} cart interactions from cart history")

        client.close()
        print(f"[INFO] Bootstrap complete — {len(product_meta)} products, "
              f"{len(interactions)} users with interaction history")
        return True

    except Exception as e:
        print(f"[WARN] MongoDB bootstrap failed: {e}")
        return False


# ── Synthetic fallback ────────────────────────────────────────────────────────

def _generate_synthetic_data(n_users: int = 50, n_products: int = 30) -> None:
    """
    Minimal synthetic data used only when MongoDB is completely unreachable.
    Keeps the service alive but recommendations will be generic.
    """
    rng = random.Random(42)
    categories = ["Electronics", "Clothing", "Beauty", "Home & Living",
                  "Sports", "Books", "Food & Grocery", "Toys"]

    for i in range(n_products):
        pid = f"SYNTHETIC_{i:04d}"
        cat = rng.choice(categories)
        product_meta[pid] = {
            "name":     f"{cat} Item {i + 1}",
            "price":    round(rng.uniform(10, 500), 2),
            "category": cat,
        }

    product_ids = list(product_meta.keys())
    for u in range(n_users):
        uid = f"SYNTHETIC_USER_{u:03d}"
        preferred = rng.sample(categories, k=rng.randint(1, 3))
        pref_prods = [p for p in product_ids
                      if product_meta[p]["category"] in preferred]
        other_prods = [p for p in product_ids if p not in pref_prods]
        for pid in rng.sample(pref_prods, k=min(8, len(pref_prods))):
            _record(uid, pid, "view")
        for pid in rng.sample(pref_prods, k=min(3, len(pref_prods))):
            _record(uid, pid, "cart")
        for pid in rng.sample(pref_prods, k=min(1, len(pref_prods))):
            _record(uid, pid, "purchase")
        for pid in rng.sample(other_prods, k=min(3, len(other_prods))):
            _record(uid, pid, "view")

    print(f"[INFO] Synthetic fallback: {n_products} products, {n_users} users")


# ── Core interaction recorder ─────────────────────────────────────────────────

def _record(user_id: str, product_id: str, action: str) -> None:
    """Record a single interaction and update derived state."""
    weight = ACTION_WEIGHT.get(action, 1.0)
    interactions[user_id][product_id] += weight
    popularity[product_id] += weight
    cat = product_meta.get(product_id, {}).get("category", "")
    if cat:
        category_affinity[user_id][cat] += weight


# ── Recommendation algorithm ──────────────────────────────────────────────────

def _cosine_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    keys = set(a) & set(b)
    if not keys:
        return 0.0
    dot   = sum(a[k] * b[k] for k in keys)
    norm_a = math.sqrt(sum(v * v for v in a.values()))
    norm_b = math.sqrt(sum(v * v for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _recommend(user_id: str, top_k: int = 5) -> list[dict[str, Any]]:
    """
    Score every unseen product for a user using three signals:
      60% collaborative filtering (similar users' preferences)
      30% category affinity (user's own category history)
      10% global popularity
    Falls back to pure popularity for cold-start users.
    """
    user_history = interactions.get(user_id, {})
    already_seen = set(user_history.keys())

    scores: dict[str, float] = defaultdict(float)
    sim_users: list[tuple[str, float]] = []

    # ── 1. Collaborative filtering ────────────────────────────────────────────
    if user_history:
        for other_uid, other_hist in interactions.items():
            if other_uid == user_id:
                continue
            sim = _cosine_similarity(user_history, other_hist)
            if sim > 0.05:
                sim_users.append((other_uid, sim))

        sim_users.sort(key=lambda x: x[1], reverse=True)
        top_similar = sim_users[:20]

        for sim_uid, sim_score in top_similar:
            for pid, interaction_score in interactions[sim_uid].items():
                if pid not in already_seen:
                    scores[pid] += sim_score * interaction_score * 0.6

    # ── 2. Category affinity ──────────────────────────────────────────────────
    user_cats = category_affinity.get(user_id, {})
    if user_cats:
        for pid, meta in product_meta.items():
            if pid in already_seen:
                continue
            cat = meta.get("category", "")
            if cat in user_cats:
                scores[pid] += user_cats[cat] * 0.3

    # ── 3. Popularity signal ──────────────────────────────────────────────────
    max_pop = max(popularity.values()) if popularity else 1.0
    for pid in product_meta:
        if pid in already_seen:
            continue
        scores[pid] += (popularity.get(pid, 0) / max_pop) * 0.1

    # ── Rank ──────────────────────────────────────────────────────────────────
    cold_start = not scores
    if cold_start:
        # No history at all — return most popular products
        ranked = sorted(
            product_meta.keys(),
            key=lambda p: popularity.get(p, 0),
            reverse=True
        )[:top_k]
    else:
        ranked = [p for p, _ in
                  sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]]

    max_score = max(scores.values()) if scores else 1.0

    # Build the set of products recommended by top-3 similar users (for reason text)
    collab_pids: set[str] = set()
    for sim_uid, _ in sim_users[:3]:
        collab_pids.update(interactions[sim_uid].keys())

    results = []
    for pid in ranked:
        meta = product_meta.get(pid, {})
        raw_score = scores.get(pid, 0.0)
        normalised = round(min(raw_score / max(max_score, 1e-9), 1.0), 4)

        # Reason text
        if cold_start:
            reason = "Trending in the marketplace"
        elif pid in collab_pids:
            reason = "Users with similar taste also liked this"
        elif meta.get("category") in user_cats:
            reason = f"Based on your interest in {meta.get('category', 'this category')}"
        else:
            reason = "Popular in the marketplace"

        results.append({
            "product_id": pid,
            "name":       meta.get("name", "Product"),
            "category":   meta.get("category", ""),
            "price":      meta.get("price", 0.0),
            "score":      normalised,
            "reason":     reason,
        })

    return results


# ── Derived state rebuild ─────────────────────────────────────────────────────

def _rebuild_derived() -> None:
    """Rebuild popularity and category_affinity from the full interactions map."""
    popularity.clear()
    category_affinity.clear()
    for uid, prods in interactions.items():
        for pid, score in prods.items():
            popularity[pid] += score
            cat = product_meta.get(pid, {}).get("category", "")
            if cat:
                category_affinity[uid][cat] += score


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup() -> None:
    global _initialized

    # 1. Load previously persisted live interactions (views, carts from the API)
    _load_interactions()

    # 2. Always try to bootstrap from MongoDB (products + purchase/cart history)
    #    This overwrites synthetic product_meta with real data.
    if not _bootstrap_from_mongo():
        if not product_meta:
            print("[WARN] MongoDB unavailable and no cached data — using synthetic fallback")
            _generate_synthetic_data()

    # 3. Rebuild derived state
    _rebuild_derived()
    _initialized = True
    print(f"[INFO] Recommender ready — {len(product_meta)} products, "
          f"{len(interactions)} users tracked")


# ── Schemas ───────────────────────────────────────────────────────────────────

class FeedbackIn(BaseModel):
    user_id:    str
    product_id: str
    action:     str  # view | cart | add_to_cart | purchase | like


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {
        "status":           "healthy",
        "service":          "marketplace-recommendation",
        "users_tracked":    len(interactions),
        "products_indexed": len(product_meta),
        "initialized":      _initialized,
    }


@app.get("/recommend/{user_id}")
def recommend(
    user_id: str,
    top_k: int = Query(default=5, ge=1, le=20)
) -> dict:
    recs = _recommend(user_id, top_k)
    return {
        "user_id":         user_id,
        "recommendations": recs,
        "total_count":     len(recs),
        "algorithm_used":  "collaborative-filtering+category-affinity+popularity",
        "generated_at":    datetime.now(timezone.utc).isoformat(),
    }


@app.post("/feedback")
def feedback(
    user_id:    str = Query(...),
    product_id: str = Query(...),
    action:     str = Query(...),
) -> dict:
    if action not in ACTION_WEIGHT:
        raise HTTPException(
            400,
            f"Unknown action '{action}'. Valid: {list(ACTION_WEIGHT)}"
        )

    # Register product if we haven't seen it yet
    if product_id not in product_meta:
        product_meta[product_id] = {
            "name":     product_id,
            "category": "",
            "price":    0.0,
        }

    _record(user_id, product_id, action)
    _save_interactions()

    return {
        "user_id":      user_id,
        "product_id":   product_id,
        "action":       action,
        "status":       "success",
        "message":      f"Interaction '{action}' recorded (weight={ACTION_WEIGHT[action]})",
        "processed_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/feedback/body")
def feedback_body(payload: FeedbackIn) -> dict:
    """Alternative: send feedback as JSON body."""
    return feedback(
        user_id=payload.user_id,
        product_id=payload.product_id,
        action=payload.action,
    )


@app.post("/refresh")
def refresh_products() -> dict:
    """
    Reload product catalogue + purchase/cart history from MongoDB.
    Call this after new products are approved or to re-seed interactions.
    Does NOT clear live interactions already recorded via /feedback.
    """
    old_products = len(product_meta)
    old_users    = len(interactions)

    if _bootstrap_from_mongo():
        _rebuild_derived()
        return {
            "status":           "refreshed",
            "products_before":  old_products,
            "products_after":   len(product_meta),
            "users_before":     old_users,
            "users_after":      len(interactions),
        }
    return {
        "status": "skipped",
        "reason": "MongoDB bootstrap failed or returned 0 products",
    }


@app.get("/")
def root() -> dict:
    return {
        "service": "marketplace-recommendation",
        "version": "2.0.0",
        "docs":    "/docs",
        "health":  "/health",
    }
