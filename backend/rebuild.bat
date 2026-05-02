@echo off
echo ========================================
echo Cleaning and Rebuilding Backend
echo ========================================

echo.
echo Step 1: Deleting target directory...
if exist target rmdir /s /q target

echo.
echo Step 2: Running Maven clean...
call mvnw.cmd clean

echo.
echo Step 3: Compiling with Lombok annotation processing...
call mvnw.cmd compile -DskipTests -X

echo.
echo ========================================
echo Build Complete!
echo ========================================
pause
