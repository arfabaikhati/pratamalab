@echo off
title PratamaLab
color 0A

SET PHP=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe
SET BACKEND=C:\laragon\www\pratamalab\backend
SET FRONTEND=C:\laragon\www\pratamalab\frontend
SET NGINX=C:\laragon\bin\nginx\nginx-1.28.2

echo.
echo  ==========================================
echo    PratamaLab - Starting...
echo  ==========================================
echo.
echo  Pastikan Laragon sudah Running!
echo  (MySQL + Nginx harus aktif di Laragon)
echo.
timeout /t 2 /nobreak >nul

:: Reload Nginx
echo  [1/3] Reload Nginx...
cd /d %NGINX%
nginx.exe -s reload -p . -c "conf/nginx.conf" >nul 2>&1
echo        OK

:: Reverb WebSocket
echo  [2/3] Starting WebSocket (Reverb)...
start "Reverb WebSocket" cmd /k "color 0B && title Reverb WebSocket && cd /d %BACKEND% && %PHP% artisan reverb:start"
timeout /t 2 /nobreak >nul

:: Queue Worker
echo  [3/3] Starting Queue Worker...
start "Queue Worker" cmd /k "color 0E && title Queue Worker && cd /d %BACKEND% && %PHP% artisan queue:work --sleep=3 --tries=3"
timeout /t 2 /nobreak >nul

:: Frontend Next.js
echo  [4/3] Starting Frontend Next.js...
start "Next.js Frontend" cmd /k "color 0D && title Next.js Frontend && cd /d %FRONTEND% && npm run dev"

echo.
echo  ==========================================
echo.
echo    Tunggu 10-15 detik lalu buka browser:
echo.
echo    http://pratamalab.test
echo.
echo    Demo login:
echo    Email    : demo@pratamalab.com
echo    Password : password
echo.
echo  ==========================================
echo.
pause
