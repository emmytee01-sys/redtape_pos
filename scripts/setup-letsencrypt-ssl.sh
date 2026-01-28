#!/bin/bash

# Setup Let's Encrypt SSL Certificate for redtapepos.com.ng
# Run this script on your EC2 server: sudo bash setup-letsencrypt-ssl.sh
# 
# Prerequisites:
# 1. Domain redtapepos.com.ng must point to 98.92.181.124 (DNS A record)
# 2. Port 80 and 443 must be open in AWS Security Group
# 3. Wait for DNS propagation (check with: nslookup redtapepos.com.ng)

set -e

DOMAIN="redtapepos.com.ng"
BACKEND_PORT="3000"
IP_ADDRESS="98.92.181.124"

echo "=== Setting up Let's Encrypt SSL for $DOMAIN ==="
echo ""
echo "⚠️  IMPORTANT: Make sure $DOMAIN points to $IP_ADDRESS"
echo "   Check DNS: nslookup $DOMAIN"
echo "   If not configured, add A record: $DOMAIN → $IP_ADDRESS"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo ""
echo "📦 Updating system packages..."
apt update

# Install Nginx and Certbot
echo ""
echo "📦 Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Backup existing nginx config if it exists
if [ -f /etc/nginx/sites-available/pos-backend ]; then
    echo ""
    echo "💾 Backing up existing Nginx configuration..."
    cp /etc/nginx/sites-available/pos-backend /etc/nginx/sites-available/pos-backend.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create Nginx configuration for domain
echo ""
echo "⚙️  Configuring Nginx for $DOMAIN..."
cat > /etc/nginx/sites-available/pos-backend << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Temporary: proxy to backend (will be redirected to HTTPS after SSL setup)
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
echo ""
echo "🔗 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/pos-backend /etc/nginx/sites-enabled/

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo ""
echo "🧪 Testing Nginx configuration..."
nginx -t

# Start and enable Nginx
echo ""
echo "🚀 Starting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx failed to start. Please check the logs: sudo journalctl -u nginx"
    exit 1
fi

# Verify domain is accessible
echo ""
echo "🌐 Verifying domain accessibility..."
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/health" | grep -q "200\|404\|502"; then
    echo "✅ Domain is accessible"
else
    echo "⚠️  Warning: Domain may not be accessible yet. Continuing anyway..."
fi

# Get SSL certificate from Let's Encrypt
echo ""
echo "🔒 Getting SSL certificate from Let's Encrypt..."
echo "   This may take a few moments..."
echo ""

# Run certbot (non-interactive mode)
if certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email; then
    echo ""
    echo "✅ SSL certificate obtained successfully!"
else
    echo ""
    echo "❌ Failed to obtain SSL certificate."
    echo ""
    echo "Common issues:"
    echo "1. DNS not propagated - wait 5-30 minutes and try again"
    echo "2. Port 80 not accessible - check AWS Security Group"
    echo "3. Domain not pointing to this server - verify DNS A record"
    echo ""
    echo "Check DNS: nslookup $DOMAIN"
    echo "Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "Check Certbot logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

# Test SSL renewal
echo ""
echo "🔄 Testing SSL certificate auto-renewal..."
certbot renew --dry-run

# Ensure auto-renewal is enabled
echo ""
echo "⏰ Ensuring auto-renewal is enabled..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Verify SSL certificate
echo ""
echo "🔍 Verifying SSL certificate..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/health" | grep -q "200\|404\|502"; then
    echo "✅ HTTPS is working!"
else
    echo "⚠️  HTTPS may not be fully working yet. Check: curl -k https://$DOMAIN/health"
fi

echo ""
echo "=== ✅ SSL Setup Complete! ==="
echo ""
echo "🌐 Your backend is now available at:"
echo "   HTTPS: https://$DOMAIN"
echo "   HTTP:  http://$DOMAIN (redirects to HTTPS)"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update Netlify environment variables:"
echo "   VITE_API_URL=https://$DOMAIN/api"
echo "   VITE_BACKEND_URL=https://$DOMAIN"
echo ""
echo "2. Update backend .env CORS_ORIGIN:"
echo "   CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app"
echo ""
echo "3. Restart backend (if needed):"
echo "   cd ~/redtap-pos/backend"
echo "   pm2 restart pos-backend"
echo ""
echo "4. Test the connection:"
echo "   curl https://$DOMAIN/health"
echo ""
echo "🔒 SSL certificate will auto-renew every 90 days"
echo ""

