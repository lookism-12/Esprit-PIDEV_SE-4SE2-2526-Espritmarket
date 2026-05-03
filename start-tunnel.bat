@echo off
title EspritMarket - Quick Tunnel
color 0A

echo ============================================
echo   EspritMarket - Cloudflare Quick Tunnel
echo ============================================
echo.
echo Make sure BEFORE running this:
echo   1. Spring Boot is running on port 8090
echo   2. Angular is running on port 4200 (ng serve)
echo.
pause

REM ── Tunnel for Spring Boot API (port 8090) ───────────────────────
echo.
echo [1/2] Starting API tunnel (port 8090)...
echo       Watch the window that opens - copy the https URL
echo       It looks like: https://xxxx-xxxx.trycloudflare.com
echo.
start "API - Spring Boot :8090" cmd /k "%~dp0cloudflared.exe tunnel --url http://localhost:8090"
timeout /t 4 /nobreak >nul

REM ── Tunnel for Angular Frontend (port 4200) ──────────────────────
echo [2/2] Starting Frontend tunnel (port 4200)...
echo       Watch the window that opens - copy the https URL
echo.
start "Frontend - Angular :4200" cmd /k "%~dp0cloudflared.exe tunnel --url http://localhost:4200"

echo.
echo ============================================
echo   Both tunnels are starting!
echo.
echo   Look at the two new windows.
echo   Each one shows a public URL like:
echo   https://random-words.trycloudflare.com
echo.
echo   Share the FRONTEND URL with teammates.
echo   Share the API URL so they can update
echo   environment.ts if needed.
echo ============================================
echo.
pause
