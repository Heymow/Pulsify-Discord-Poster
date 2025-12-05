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

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please run 'setup.bat' first to install the necessary requirements.
    echo.
    pause
    exit
)

:: Check for NPM and get path
set "NPM_PATH="
for /f "tokens=*" %%i in ('where npm') do (
    set "NPM_PATH=%%~dpi"
    goto :FoundNpm
)

:FoundNpm
if "%NPM_PATH%"=="" (
    echo [ERROR] NPM is not installed or not in your PATH.
    echo Please run 'setup.bat' first to install the necessary requirements.
    echo.
    pause
    exit
)

:: Remove trailing backslash
set "NPM_PATH=%NPM_PATH:~0,-1%"

echo Found NPM at: %NPM_PATH%
echo.

:: Check if dependencies are installed
if not exist "source\backend\node_modules" (
    echo [ERROR] Backend dependencies not found.
    echo Please run 'setup.bat' to install them.
    echo.
    pause
    exit
)

if not exist "source\frontend\node_modules" (
    echo [ERROR] Frontend dependencies not found.
    echo Please run 'setup.bat' to install them.
    echo.
    pause
    exit
)

start "Discord Poster - Backend" cmd /k "set "PATH=%NPM_PATH%;%PATH%" && cd source\backend && npm run dev"
timeout /t 5 /nobreak > nul
start "Discord Poster - Frontend" cmd /k "set "PATH=%NPM_PATH%;%PATH%" && cd source\frontend && npm run dev"

echo Servers launched in background windows.
echo.
timeout /t 5 /nobreak > nul
start http://localhost:5173
exit
