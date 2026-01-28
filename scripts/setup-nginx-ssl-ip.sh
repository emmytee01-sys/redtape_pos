#!/bin/bash

# Setup Nginx with self-signed SSL for IP address
# Run: sudo bash setup-nginx-ssl-ip.sh

set -e

IP_ADDRESS="98.92.181.124"
BACKEND_PORT="3000"

echo "=== Installing Nginx and setting up SSL for IP: $IP_ADDRESS ==="

# Update system
sudo apt update

# Install Nginx
sudo apt install -y nginx openssl

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
echo "Generating self-signed certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$IP_ADDRESS"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pos-backend > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $IP_ADDRESS;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $IP_ADDRESS;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/pos-backend /etc/nginx/sites-enabled/

# Remove default site
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=== ✅ Setup Complete! ==="
echo ""
echo "⚠️  NOTE: This uses a self-signed certificate."
echo "   Browsers will show a security warning, but API calls will work."
echo ""
echo "Your backend is now available at:"
echo "   HTTPS: https://$IP_ADDRESS"
echo "   (HTTP will redirect to HTTPS)"
echo ""
echo "To accept the certificate in browsers:"
echo "   - Click 'Advanced' -> 'Proceed to site'"
echo ""
echo "For API calls (frontend):"
echo "   The self-signed certificate will work, but you may need to:"
echo "   - Configure your backend to accept self-signed certs, OR"
echo "   - Use a tool like Cloudflare Tunnel for browser-friendly HTTPS"
echo ""
echo "Update Netlify environment variables:"
echo "   VITE_API_URL=https://$IP_ADDRESS/api"
echo "   VITE_BACKEND_URL=https://$IP_ADDRESS"
echo ""
echo "Update backend .env CORS_ORIGIN:"
echo "   CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app"
echo ""

