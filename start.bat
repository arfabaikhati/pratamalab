@echo off
title PratamaLab Launcher

SET PHP=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe
SET BACKEND=C:\laragon\www\pratamalab\backend
SET FRONTEND=C:\laragon\www\pratamalab\frontend

echo ============================================
echo   PratamaLab - Starting all services...
echo ============================================

:: Start Laravel API server
echo [1/3] Starting Laravel API (port 8000)...
start "PratamaLab - API Server" cmd /k "title API Server && cd /d %BACKEND% && %PHP% artisan serve --port=8000"

:: Wait a moment
timeout /t 2 /nobreak > nul

:: Start Reverb WebSocket
echo [2/3] Starting Reverb WebSocket (port 8080)...
start "PratamaLab - WebSocket" cmd /k "title WebSocket Reverb && cd /d %BACKEND% && %PHP% artisan reverb:start"

:: Wait a moment
timeout /t 2 /nobreak > nul

:: Start Queue Worker
echo [3/3] Starting Queue Worker...
start "PratamaLab - Queue" cmd /k "title Queue Worker && cd /d %BACKEND% && %PHP% artisan queue:work"

:: Wait a moment
timeout /t 3 /nobreak > nul

:: Start Next.js Frontend
echo [4/3] Starting Frontend (port 3000)...
start "PratamaLab - Frontend" cmd /k "title Frontend && cd /d %FRONTEND% && npm run dev"

echo.
echo ============================================
echo   Semua service sudah berjalan!
echo   Buka browser: http://localhost:3000
echo ============================================
echo.
pause
