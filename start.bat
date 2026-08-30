@echo off
title PratamaLab
color 0A
cls

echo.
echo  =========================================
echo       PratamaLab - Starting...
echo  =========================================
echo.
echo  Pastikan Laragon sudah Running terlebih
echo  dahulu (klik Start di Laragon).
echo.
timeout /t 3 /nobreak >nul

SET PHP=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe
SET BACKEND=C:\laragon\www\pratamalab\backend
SET FRONTEND=C:\laragon\www\pratamalab\frontend
SET NGINX=C:\laragon\bin\nginx\nginx-1.28.2

:: Reload Nginx
echo  [1/3] Reload Nginx...
cd /d "%NGINX%"
nginx.exe -s reload -p . -c "conf/nginx.conf" >nul 2>&1
echo        Done.

:: Reverb WebSocket
echo  [2/3] Memulai WebSocket (Reverb)...
start "Reverb WebSocket" cmd /k "color 0B && title Reverb WebSocket && cd /d "%BACKEND%" && "%PHP%" artisan reverb:start"
timeout /t 2 /nobreak >nul

:: Queue Worker
echo  [3/3] Memulai Queue Worker...
start "Queue Worker" cmd /k "color 0E && title Queue Worker && cd /d "%BACKEND%" && "%PHP%" artisan queue:work --sleep=3 --tries=3"
timeout /t 2 /nobreak >nul

:: Frontend Next.js
echo  [4/3] Memulai Next.js Frontend...
start "Next.js Frontend" cmd /k "color 0D && title Next.js Frontend && cd /d "%FRONTEND%" && npm run dev"

echo.
echo  =========================================
echo.
echo   Tunggu 10-15 detik sampai Next.js siap
echo   lalu buka browser ke:
echo.
echo      http://pratamalab.test
echo.
echo   Demo login:
echo   Email    : demo@pratamalab.com
echo   Password : password
echo.
echo  =========================================
echo.

:: Tunggu 15 detik lalu buka browser otomatis
echo  Membuka browser dalam 15 detik...
timeout /t 15 /nobreak >nul
start http://pratamalab.test

exit
