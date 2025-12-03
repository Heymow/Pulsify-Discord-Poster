@echo off
echo ======================================
echo   Discord Poster - Installation
echo ======================================
echo.
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)

cd ..
echo.
echo ======================================
echo   Installation Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Copy backend\.env.example to backend\.env
echo 2. Configure your settings in backend\.env
echo 3. Run start.bat to launch the application
echo.
pause
