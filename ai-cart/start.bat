@echo off
echo ========================================
echo  EspritMarket Cart ML Service
echo ========================================

echo.
echo [1/3] Checking dependencies...
pip install -r requirements.txt -q

echo.
echo [2/3] Checking models...
if not exist "models\rf_promo.pkl" (
    echo  Models not found - training now...
    cd scripts
    python train_model.py
    cd ..
) else (
    echo  Models found - skipping training
)

echo.
echo [3/3] Starting API on http://localhost:8002
echo  Docs: http://localhost:8002/docs
echo.
cd app
uvicorn main:app --reload --port 8002 --host 0.0.0.0
