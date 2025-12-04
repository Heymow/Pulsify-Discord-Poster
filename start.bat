@echo off
echo ==========================================
echo        Starting Discord Poster
echo ==========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo [INFO] Press Ctrl+C in the popup windows to stop servers.
echo.

start "Discord Poster - Backend" cmd /k "cd source\backend && npm run dev"
timeout /t 2 /nobreak > nul
start "Discord Poster - Frontend" cmd /k "cd source\frontend && npm run dev"

echo Servers launched in background windows.
echo.
exit
