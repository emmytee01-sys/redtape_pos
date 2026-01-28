#!/bin/bash

# Setup Nginx with Let's Encrypt SSL for POS Backend
# Run this script on your server: sudo bash setup-nginx-ssl.sh

set -e

echo "=== Setting up Nginx with SSL for POS Backend ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., api.yourdomain.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "Domain name is required!"
    exit 1
fi

echo "Domain: $DOMAIN"

# Update system
echo "Updating system packages..."
apt update

# Install Nginx and Certbot
echo "Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/pos-backend << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect HTTP to HTTPS (will be enabled after SSL)
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration (will be added by Certbot)
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to backend
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
        
        # Increase timeouts for large requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
echo "Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/pos-backend /etc/nginx/sites-enabled/

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Start and enable Nginx
echo "Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Get SSL certificate
echo "Getting SSL certificate from Let's Encrypt..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

# Test SSL renewal
echo "Testing SSL certificate renewal..."
certbot renew --dry-run

# Setup auto-renewal (usually already enabled via systemd timer)
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "=== Setup Complete! ==="
echo "Your backend is now available at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update Netlify environment variables:"
echo "   VITE_API_URL=https://$DOMAIN/api"
echo "   VITE_BACKEND_URL=https://$DOMAIN"
echo ""
echo "2. Update backend .env file:"
echo "   CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app"
echo ""
echo "3. Restart backend:"
echo "   cd ~/redtap-pos/backend"
echo "   npm run build"
echo "   pm2 restart pos-backend"

