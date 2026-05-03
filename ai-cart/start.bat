@echo off
echo ============================================
echo  EspritMarket Marketplace ML Service
echo  Port: 8002
echo ============================================
echo.

REM Check if models exist, train if not
if not exist "models\rf_promo.pkl" (
    echo [INFO] Models not found. Training now...
    py scripts\generate_and_train.py
    if errorlevel 1 (
        echo [ERROR] Training failed. Check Python and dependencies.
        pause
        exit /b 1
    )
    echo [INFO] Training complete.
    echo.
)

echo [INFO] Starting ML service on port 8002...
py -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
