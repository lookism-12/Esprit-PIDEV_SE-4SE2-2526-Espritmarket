# AI Delivery ETA + Weather Risk Tracking

Pipeline:

1. ENV
   `python -m venv .venv`
   `.\.venv\Scripts\pip install -r requirements.txt`

2. DATASET
   `python scripts/generate_dataset.py`

3. CLEANING
   `python scripts/clean_dataset.py`

4. TRAINING
   `python scripts/train_model.py`

5. PREDICTION
   `uvicorn app.main:app --host 127.0.0.1 --port 8000`

Spring Boot calls `/predict` and stores the result in MongoDB collection `delivery_eta_predictions`.
