#!/bin/bash
echo "Starting Discord Poster..."
echo ""
echo "Backend starting on http://localhost:5000"
echo "Frontend starting on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend in foreground
cd frontend && npm run dev

# When frontend is killed, also kill backend
kill $BACKEND_PID
