# AI Forum Recommendation Service

FastAPI microservice for recommending similar forum posts.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
$env:MONGODB_URI="mongodb://localhost:27017/esprit_market"
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

## Endpoints

- `GET /health`
- `POST /recommend`
- `POST /admin/reindex`

`/recommend` payload:

```json
{
  "post_id": "mongo-object-id",
  "content": "Title\nPost body",
  "category_id": "category-object-id",
  "top_k": 5
}
```

MongoDB posts are the primary source. The files in `artifacts/` are used as a fallback when MongoDB is unavailable or empty.
