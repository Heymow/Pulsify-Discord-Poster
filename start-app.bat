@echo off
echo Starting Discord Poster App...

:: Start Backend
start "Discord Poster Backend" cmd /k "cd backend && npm run dev"

:: Start Frontend
start "Discord Poster Frontend" cmd /k "cd frontend && npm run dev"

echo App started! 
echo Backend running on http://localhost:3000
echo Frontend running on http://localhost:5173
pause
