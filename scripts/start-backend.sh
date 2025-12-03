#!/bin/bash

# Startup script for the Ztarknet backend service

echo "Starting Ztarknet backend services..."

# Start the main bridge service
echo "Starting bridge service..."
cd backend-service
npm run dev &
BRIDGE_PID=$!

# Start the explorer service
echo "Starting explorer service..."
npm run explorer &
EXPLORER_PID=$!

echo "Backend services started!"
echo "Bridge service PID: $BRIDGE_PID"
echo "Explorer service PID: $EXPLORER_PID"
echo ""
echo "Explorer available at: http://localhost:3001"
echo "Press Ctrl+C to stop services"

# Wait for both processes
wait $BRIDGE_PID
wait $EXPLORER_PID