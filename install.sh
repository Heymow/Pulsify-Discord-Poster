#!/bin/bash
echo "======================================"
echo "  Discord Poster - Installation"
echo "======================================"
echo ""
echo "Installing backend dependencies..."
cd backend && npm install

echo ""
echo "Installing frontend dependencies..."
cd ../frontend && npm install

echo ""
echo "======================================"
echo "  Installation Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Copy backend/.env.example to backend/.env"
echo "2. Configure your settings in backend/.env"
echo "3. Run ./start.sh to launch the application"
echo ""
