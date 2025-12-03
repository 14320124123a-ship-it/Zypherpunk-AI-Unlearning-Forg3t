#!/bin/bash

# Start Cloudflare Tunnel for Zcash Node
# This script starts a tunnel to expose the local Zcash node to the internet

echo "Starting Cloudflare Tunnel for Zcash Node..."
echo "Make sure your Zcash node is running on http://127.0.0.1:18232"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null
then
    echo "cloudflared could not be found. Please install it first:"
    echo "Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
fi

# Start the tunnel
echo "Starting tunnel..."
cloudflared tunnel --url http://127.0.0.1:18232

echo "Tunnel stopped."