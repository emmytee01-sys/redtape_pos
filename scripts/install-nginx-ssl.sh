#!/bin/bash

# Install Nginx and Certbot for SSL on POS Backend
# Run: sudo bash install-nginx-ssl.sh

set -e

echo "=== Installing Nginx and Certbot ==="

# Update system
sudo apt update

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Check if domain is provided
if [ -z "$1" ]; then
    echo ""
    echo "⚠️  WARNING: Let's Encrypt requires a domain name!"
    echo ""
    echo "You have two options:"
    echo ""
    echo "Option 1: Use a domain name (recommended)"
    echo "  - Get a domain (e.g., from Namecheap, GoDaddy)"
    echo "  - Point A record to: 98.92.181.124"
    echo "  - Then run: sudo bash install-nginx-ssl.sh yourdomain.com"
    echo ""
    echo "Option 2: Use Cloudflare Tunnel (no domain needed)"
    echo "  - Run: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared"
    echo "  - Run: chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/"
    echo "  - Run: cloudflared tunnel --url http://localhost:3000"
    echo ""
    read -p "Do you have a domain name? (y/n): " has_domain
    
    if [ "$has_domain" != "y" ]; then
        echo ""
        echo "Setting up Cloudflare Tunnel instead..."
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
        chmod +x cloudflared
        sudo mv cloudflared /usr/local/bin/
        echo ""
        echo "✅ Cloudflared installed!"
        echo "Run this command to get HTTPS URL:"
        echo "  cloudflared tunnel --url http://localhost:3000"
        echo ""
        echo "Then use the HTTPS URL in Netlify environment variables"
        exit 0
    else
        read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN
    fi
else
    DOMAIN=$1
fi

echo ""
echo "Setting up SSL for domain: $DOMAIN"
echo ""

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pos-backend > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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
echo "✅ Nginx installed and configured!"
echo ""
echo "Getting SSL certificate from Let's Encrypt..."
echo "Make sure your domain $DOMAIN points to 98.92.181.124"
echo ""

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

# Test auto-renewal
sudo certbot renew --dry-run

echo ""
echo "=== ✅ SSL Setup Complete! ==="
echo ""
echo "Your backend is now available at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update Netlify environment variables:"
echo "   VITE_API_URL=https://$DOMAIN/api"
echo "   VITE_BACKEND_URL=https://$DOMAIN"
echo ""
echo "2. Update backend .env CORS_ORIGIN:"
echo "   CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app"
echo ""
echo "3. Restart backend:"
echo "   cd ~/redtap-pos/backend"
echo "   npm run build"
echo "   pm2 restart pos-backend"

