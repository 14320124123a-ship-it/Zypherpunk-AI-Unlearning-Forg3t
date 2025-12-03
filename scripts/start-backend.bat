@echo off
echo Starting Ztarknet backend services...

echo Starting bridge service...
cd backend-service
start "Bridge Service" cmd /k "npm run dev"

echo Starting explorer service...
start "Explorer Service" cmd /k "npm run explorer"

echo Backend services started!
echo Explorer available at: http://localhost:3001
echo Press any key to close this window...
pause >nul