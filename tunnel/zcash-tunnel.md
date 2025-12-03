# Zcash Cloudflare Tunnel Setup

This guide explains how to set up a Cloudflare tunnel to expose your local Zcash node to the cloud backend.

## Prerequisites

1. A running Zcash node on your local machine
2. Cloudflare account
3. `cloudflared` CLI tool installed

## Installation

### Install cloudflared

#### Windows
```powershell
# Download the installer from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# Or use Chocolatey
choco install cloudflared
```

#### macOS
```bash
# Using Homebrew
brew install cloudflared
```

#### Linux
```bash
# Download the latest release
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

## Setting up the Tunnel

1. Run the tunnel command:
```bash
cloudflared tunnel --url http://127.0.0.1:18232
```

2. The command will output a URL like:
```
https://random-string.trycloudflare.com
```

3. Copy this URL and add it to your backend `.env.production` file:
```
ZCASH_REMOTE_RPC_URL=https://random-string.trycloudflare.com
```

## Keeping the Tunnel Running

For production use, you should run the tunnel as a service:

### Windows (as a service)
```powershell
# Create a service configuration
cloudflared service install --url http://127.0.0.1:18232
```

### Linux/macOS (using systemd)
```bash
# Create a systemd service file
sudo nano /etc/systemd/system/cloudflared-zcash.service
```

Add the following content:
```ini
[Unit]
Description=Cloudflare Tunnel for Zcash Node
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --url http://127.0.0.1:18232
Restart=always
RestartSec=5
User=your-username

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:
```bash
sudo systemctl enable cloudflared-zcash
sudo systemctl start cloudflared-zcash
```

## Testing the Connection

To verify the tunnel is working:

1. Check that your local Zcash node is running:
```bash
curl --user rpcuser:rpcpassword --data-binary '{"jsonrpc":"1.0","id":"curltest","method":"getblockchaininfo","params":[]}' -H 'content-type:text/plain;' http://127.0.0.1:18232
```

2. Test the remote URL (replace with your actual tunnel URL):
```bash
curl --user rpcuser:rpcpassword --data-binary '{"jsonrpc":"1.0","id":"curltest","method":"getblockchaininfo","params":[]}' -H 'content-type:text/plain;' https://your-tunnel-url.trycloudflare.com
```

Both should return the same blockchain information.

## Troubleshooting

### Common Issues

1. **Authentication failed**: Make sure the RPC credentials in your `.env` file match those in your Zcash configuration.

2. **Connection refused**: Ensure your Zcash node is running and listening on port 18232.

3. **Tunnel disconnects**: For production use, run the tunnel as a service rather than in a terminal session.

### Logs

To view tunnel logs:
```bash
cloudflared tunnel --url http://127.0.0.1:18232 --loglevel info
```

## Security Considerations

1. Always use strong RPC credentials for your Zcash node
2. Limit RPC access to only necessary methods
3. Consider using a firewall to restrict access to your local node
4. Regularly rotate your RPC credentials