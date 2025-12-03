@echo off
echo Starting Discord Poster...
echo.
echo Backend starting on http://localhost:5000
echo Frontend starting on http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop
echo.

start "Discord Poster - Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul
start "Discord Poster - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo.
pause
