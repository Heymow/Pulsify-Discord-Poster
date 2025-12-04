#!/bin/bash

echo "=========================================="
echo "      Discord Poster - Initial Setup"
echo "=========================================="
echo ""

# 1. Check for Node.js
echo "[1/4] Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "Node.js is NOT installed."
    echo "Please install Node.js manually for your operating system."
    echo "Visit https://nodejs.org/ for instructions."
    exit 1
fi

echo "Node.js is present:"
node -v
echo ""

# 2. Install Backend Dependencies
echo "[2/4] Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies."
    exit 1
fi
cd ..
echo ""

# 3. Install Frontend Dependencies
echo "[3/4] Installing Frontend Dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies."
    exit 1
fi
cd ..
echo ""

# 4. Configuration
echo "[4/4] Checking Configuration..."
if [ ! -f backend/.env ]; then
    echo "Creating default .env file..."
    cp backend/.env.example backend/.env
    echo ""
    echo "[IMPORTANT] A new .env file has been created in the 'backend' folder."
    echo "Please edit it with your Discord credentials before starting!"
else
    echo "Configuration file already exists."
fi

echo ""
echo "=========================================="
echo "           Setup Complete!"
echo "=========================================="
echo ""
echo "You can now start the application by running: ./start.sh"
echo ""
