@echo off
title PratamaLab Launcher
color 0A

SET PHP=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe
SET BACKEND=C:\laragon\www\pratamalab\backend
SET FRONTEND=C:\laragon\www\pratamalab\frontend
SET NGINX=C:\laragon\bin\nginx\nginx-1.28.2

echo ============================================
echo   PratamaLab - Starting services...
echo ============================================
echo.

:: Reload Nginx config
echo [1/3] Reloading Nginx...
cd /d %NGINX%
nginx.exe -s reload -p . -c "conf/nginx.conf" >nul 2>&1
echo      OK - Nginx running (pratamalab.test)

:: Reverb WebSocket
echo [2/3] Starting Reverb WebSocket (port 8080)...
start "PratamaLab - WebSocket" cmd /k "title WebSocket ^| Reverb && cd /d %BACKEND% && %PHP% artisan reverb:start"

timeout /t 2 /nobreak >nul

:: Queue Worker
echo [3/3] Starting Queue Worker...
start "PratamaLab - Queue" cmd /k "title Queue Worker && cd /d %BACKEND% && %PHP% artisan queue:work --sleep=3 --tries=3"

timeout /t 2 /nobreak >nul

:: Frontend Next.js
echo [4/3] Starting Frontend (port 3000)...
start "PratamaLab - Frontend" cmd /k "title Frontend ^| Next.js && cd /d %FRONTEND% && npm run dev"

echo.
echo ============================================
echo   Semua service berjalan!
echo.
echo   Akses via localhost:
echo   - Frontend : http://localhost:3000
echo   - Backend  : http://localhost:8000 (php artisan serve manual)
echo.
echo   Akses via Nginx domain:
echo   - Frontend : http://app.pratamalab.test
echo   - Backend  : http://pratamalab.test
echo   - WebSocket: ws://ws.pratamalab.test
echo ============================================
echo.
pause
