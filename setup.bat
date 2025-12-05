@echo off
setlocal EnableDelayedExpansion

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ==========================================
echo      Discord Poster - Initial Setup
echo ==========================================
echo.

:: 1. Check for Node.js
echo [1/4] Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% equ 0 goto :NodeInstalled

echo Node.js is NOT installed.
echo.
echo Attempting to install Node.js using Chocolatey...

:: Check for Chocolatey
choco -v >nul 2>&1
if %errorlevel% equ 0 goto :InstallNode

echo Chocolatey not found. Installing Chocolatey...
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
if %errorlevel% neq 0 (
    echo Failed to install Chocolatey. Aborting.
    pause
    exit /b 1
)

:InstallNode
echo Installing Node.js...
choco install nodejs --version="25.2.1" -y
if %errorlevel% neq 0 (
    echo Failed to install Node.js. Aborting.
    pause
    exit /b 1
)

echo.
echo Node.js installed successfully!
echo Please RESTART this script to continue with dependency installation.
echo (Environment variables need to refresh)
pause
exit /b 0

:NodeInstalled
echo Node.js is present:
node -v
echo.

:: 2. Find NPM
echo [2/4] Locating NPM...
set "NPM_PATH="
for /f "tokens=*" %%i in ('where npm') do set "NPM_PATH=%%~dpi"

if "%NPM_PATH%"=="" (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set "NPM_PATH=C:\Program Files\nodejs\"
    ) else (
        echo [WARNING] NPM not found in PATH.
    )
) else (
    set "NPM_PATH=%NPM_PATH:~0,-1%"
    echo Found NPM at: !NPM_PATH!
)

:: Add NPM to PATH for this session
if not "%NPM_PATH%"=="" set "PATH=!NPM_PATH!;!PATH!"

echo.

:: 3. Install Backend Dependencies
echo [3/4] Installing Backend Dependencies...
cd source\backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo [ERROR] npm install finished but node_modules folder is missing.
    pause
    exit /b 1
)
cd ..\..
echo.

:: 4. Install Frontend Dependencies
echo [4/4] Installing Frontend Dependencies...
cd source\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo [ERROR] npm install finished but node_modules folder is missing.
    pause
    exit /b 1
)
cd ..\..
echo.

:: 5. Configuration
echo [5/5] Checking Configuration...
if not exist source\backend\.env (
    echo Creating default .env file...
    copy source\backend\.env.example source\backend\.env >nul
    echo.
    echo [IMPORTANT] A new .env file has been created in the 'source\backend' folder.
    echo Please edit it with your Discord credentials before starting!
) else (
    echo Configuration file already exists.
)

echo.
echo ==========================================
echo           Setup Complete!
echo ==========================================
echo.
echo You can now start the application by running: start.bat
echo.
pause
