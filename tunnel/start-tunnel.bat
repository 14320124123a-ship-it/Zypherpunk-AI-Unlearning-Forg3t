@echo off
setlocal

echo Starting Cloudflare Tunnel for Zcash Node...
echo Make sure your Zcash node is running on http://127.0.0.1:18232

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo cloudflared could not be found. Please install it first:
    echo Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
    pause
    exit /b 1
)

echo Starting tunnel...
cloudflared tunnel --url http://127.0.0.1:18232

echo Tunnel stopped.
pause