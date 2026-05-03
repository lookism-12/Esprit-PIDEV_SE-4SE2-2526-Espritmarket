@echo off
echo ============================================
echo  EspritMarket Forum Recommendation AI
echo  Port: 8001  ^|  Algorithm: FAISS + MiniLM
echo ============================================
echo.

REM Set MongoDB URI if not already set
if "%MONGODB_URI%"=="" (
    set MONGODB_URI=mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true^&w=majority
)

echo [INFO] Starting Forum AI service on port 8001...
echo [INFO] MongoDB: %MONGODB_URI:~0,40%...
echo.
py -m uvicorn app.main:app --host 127.0.0.1 --port 8001
