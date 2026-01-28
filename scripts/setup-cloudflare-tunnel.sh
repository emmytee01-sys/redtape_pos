#!/bin/bash

# Setup Cloudflare Tunnel for HTTPS without domain
# Run: bash setup-cloudflare-tunnel.sh

set -e

echo "=== Installing Cloudflare Tunnel ==="

# Download cloudflared
cd ~
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

echo "✅ Cloudflared installed!"

# Create systemd service
sudo tee /etc/systemd/system/cloudflared.service > /dev/null << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

echo ""
echo "✅ Cloudflare Tunnel service started!"
echo ""
echo "Getting tunnel URL..."
sleep 3

# Get the tunnel URL from logs
TUNNEL_URL=$(sudo journalctl -u cloudflared --no-pager -n 50 | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1)

echo ""
echo "=== ✅ Setup Complete! ==="
echo ""
echo "Your HTTPS URL is: $TUNNEL_URL"
echo ""
echo "To see the URL, run: sudo journalctl -u cloudflared -n 50 | grep https"
echo ""
echo "Next steps:"
echo "1. Copy the HTTPS URL above"
echo "2. Update Netlify environment variables:"
echo "   VITE_API_URL=$TUNNEL_URL/api"
echo "   VITE_BACKEND_URL=$TUNNEL_URL"
echo ""
echo "3. Update backend .env CORS_ORIGIN:"
echo "   CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app"
echo ""
echo "4. Restart backend:"
echo "   cd ~/redtap-pos/backend"
echo "   pm2 restart pos-backend"


