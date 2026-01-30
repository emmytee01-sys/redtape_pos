# Setup HTTPS for Backend API

## Problem
Netlify serves the frontend over HTTPS, but the backend API is HTTP. Browsers block mixed content (HTTPS → HTTP requests).

## Solution: Set up Nginx Reverse Proxy with SSL

### Step 1: Install Nginx and Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Configure Nginx Reverse Proxy

Create nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/pos-backend
```

Add this configuration (replace `your-domain.com` with your actual domain or use a subdomain):

```nginx
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/pos-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 3: Get SSL Certificate

**Option A: With Domain Name**
```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

**Option B: Without Domain (Use IP with SSL - requires paid solution or domain)**
If you don't have a domain, you'll need to:
1. Purchase a domain (cheap options: Namecheap, GoDaddy, etc.)
2. Point domain A record to your server IP: 98.92.181.124
3. Wait for DNS propagation
4. Run certbot as shown above

### Step 4: Update Backend CORS

Edit `.env` file:
```bash
cd ~/redtap-pos/backend
nano .env
```

Update CORS_ORIGIN:
```
CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app
```

Rebuild and restart:
```bash
npm run build
pm2 restart pos-backend
```

### Step 5: Update Netlify Environment Variables

In Netlify dashboard, update:
```
VITE_API_URL=https://your-domain.com/api
VITE_BACKEND_URL=https://your-domain.com
```

## Quick Alternative: Use Cloudflare Tunnel (No Domain Needed)

If you don't have a domain, use Cloudflare Tunnel for free HTTPS:

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Run tunnel (creates HTTPS URL)
cloudflared tunnel --url http://localhost:3000
```

This will give you an HTTPS URL like: `https://xxxx.trycloudflare.com`

Update Netlify with this URL:
```
VITE_API_URL=https://xxxx.trycloudflare.com/api
VITE_BACKEND_URL=https://xxxx.trycloudflare.com
```

## Temporary Workaround (For Testing Only)

You can temporarily bypass mixed content by:

1. **Chrome**: Launch with `--disable-web-security` flag (NOT recommended for production)
2. **Use HTTP Netlify URL**: Deploy frontend with HTTP instead of HTTPS (not possible on Netlify)
3. **Use ngrok**: Quick HTTPS tunnel for testing

```bash
# On your server
ngrok http 3000
# Use the HTTPS URL provided
```

## Recommended Solution

For production, set up a proper domain with SSL certificate:
1. Get a domain (e.g., from Namecheap ~$10/year)
2. Point DNS to your server IP
3. Use Let's Encrypt (free SSL) via Certbot
4. This gives you: `https://api.yourdomain.com` permanently

