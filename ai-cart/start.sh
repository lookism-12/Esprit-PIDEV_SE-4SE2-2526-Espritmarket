#!/bin/bash

echo "========================================"
echo "Starting EspritMarket Cart ML Service"
echo "========================================"

echo ""
echo "Checking if models exist..."
if [ ! -f "models/rf_promo.pkl" ]; then
    echo ""
    echo "⚠️ Models not found! Training models first..."
    echo ""
    cd scripts
    python train_model.py
    cd ..
    echo ""
fi

echo ""
echo "Starting FastAPI server on port 8002..."
echo ""
cd app
uvicorn main:app --reload --port 8002 --host 0.0.0.0
