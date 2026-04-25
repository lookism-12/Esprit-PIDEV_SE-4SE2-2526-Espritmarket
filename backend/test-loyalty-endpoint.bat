@echo off
REM 🧪 Loyalty Config Endpoint Test Script (Windows)
REM This script tests the /api/admin/loyalty-config endpoint

echo 🧪 Testing Loyalty Config Endpoint
echo ==================================
echo.

REM Configuration
set BASE_URL=http://localhost:8080
set ADMIN_EMAIL=admin@espritmarket.com
set ADMIN_PASSWORD=admin123

REM Step 1: Check if backend is running
echo 📡 Step 1: Checking if backend is running...
curl -s -o nul -w "%%{http_code}" "%BASE_URL%/api/auth/login" > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="000" (
    echo ❌ Backend is not running or not accessible
    echo    Please start the backend with: mvnw spring-boot:run
    exit /b 1
) else (
    echo ✅ Backend is running
)
echo.

REM Step 2: Login as admin
echo 🔐 Step 2: Logging in as admin...
curl -s -X POST "%BASE_URL%/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"%ADMIN_EMAIL%\",\"password\":\"%ADMIN_PASSWORD%\"}" > login_response.json

REM Note: Token extraction in batch is complex, manual verification recommended
echo ✅ Login request sent
echo    Check login_response.json for token
echo.

REM Step 3: Test GET endpoint (requires manual token)
echo 📥 Step 3: Testing GET /api/admin/loyalty-config...
echo    Please run this command manually with your token:
echo.
echo    curl -X GET %BASE_URL%/api/admin/loyalty-config ^
echo      -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.

REM Step 4: Instructions
echo ==================================
echo 📊 Manual Testing Required
echo ==================================
echo.
echo Windows batch scripts have limited JSON parsing capabilities.
echo Please follow these steps:
echo.
echo 1. Open login_response.json and copy the token value
echo 2. Run this command in PowerShell or Git Bash:
echo.
echo    curl -X GET %BASE_URL%/api/admin/loyalty-config \
echo      -H "Authorization: Bearer YOUR_TOKEN"
echo.
echo 3. Expected responses:
echo    - 200 OK: Endpoint is working ✅
echo    - 404 Not Found: Controller not registered ❌
echo    - 401 Unauthorized: Token is invalid ⚠️
echo.
echo For detailed troubleshooting, see BACKEND_TROUBLESHOOTING.md
echo.

REM Cleanup
if exist login_response.json del login_response.json

pause
