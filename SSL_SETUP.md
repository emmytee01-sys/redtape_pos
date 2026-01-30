# SSL Certificate Setup for redtapepos.com.ng

## Quick Setup Guide

This guide will help you set up a free Let's Encrypt SSL certificate for your domain `redtapepos.com.ng`.

## Prerequisites

1. ✅ Domain `redtapepos.com.ng` must point to `98.92.181.124`
   - Add DNS A record: `redtapepos.com.ng` → `98.92.181.124`
   - Wait for DNS propagation (check with: `nslookup redtapepos.com.ng`)

2. ✅ AWS Security Group must allow:
   - Port 80 (HTTP) - for Let's Encrypt verification
   - Port 443 (HTTPS) - for secure connections
   - Port 22 (SSH) - for server access

3. ✅ Backend server must be running on port 3000

## Step-by-Step Instructions

### 1. Verify DNS Configuration

Before running the script, verify your domain points to the server:

```bash
# On your local machine
nslookup redtapepos.com.ng
# Should return: 98.92.181.124
```

If DNS is not configured yet:
- Go to your domain registrar (where you bought the domain)
- Add an A record: `redtapepos.com.ng` → `98.92.181.124`
- Wait 5-30 minutes for DNS propagation

### 2. SSH into Your Server

```bash
ssh -i your-key.pem ubuntu@98.92.181.124
```

### 3. Navigate to Project Directory

```bash
cd ~/redtap-pos
```

### 4. Pull Latest Code (if needed)

```bash
git pull origin main
```

### 5. Run the SSL Setup Script

```bash
sudo bash scripts/setup-letsencrypt-ssl.sh
```

The script will:
- Install Nginx and Certbot
- Configure Nginx as a reverse proxy
- Obtain SSL certificate from Let's Encrypt
- Set up auto-renewal
- Test the configuration

### 6. Verify SSL Certificate

After the script completes, test the SSL:

```bash
# Test HTTPS connection
curl https://redtapepos.com.ng/health

# Check certificate details
curl -vI https://redtapepos.com.ng 2>&1 | grep -i "certificate\|ssl"
```

### 7. Update Backend CORS

Update the backend `.env` file to allow requests from your frontend:

```bash
cd ~/redtap-pos/backend
nano .env
```

Update `CORS_ORIGIN`:
```
CORS_ORIGIN=http://localhost:5173,https://redtapepos.netlify.app
```

Rebuild and restart:
```bash
npm run build
pm2 restart pos-backend
```

### 8. Update Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site → **Site settings** → **Environment variables**
3. Update these variables:
   - `VITE_API_URL` = `https://redtapepos.com.ng/api`
   - `VITE_BACKEND_URL` = `https://redtapepos.com.ng`
4. **Important:** Remove `:3000` and use `https://` (not `http://`)
5. Save and trigger a new deployment

### 9. Test the Complete Setup

1. Visit your Netlify frontend: `https://redtapepos.netlify.app`
2. Try logging in
3. Check browser console for errors
4. Verify API calls are working

## Troubleshooting

### DNS Not Propagated

**Error:** `Failed to obtain SSL certificate` or `Domain not pointing to server`

**Solution:**
- Wait 5-30 minutes after adding DNS record
- Check DNS: `nslookup redtapepos.com.ng`
- Verify A record is correct in your domain registrar

### Port 80/443 Not Accessible

**Error:** `Connection refused` or `Timeout`

**Solution:**
- Check AWS Security Group:
  - Inbound rules must allow port 80 (HTTP) from `0.0.0.0/0`
  - Inbound rules must allow port 443 (HTTPS) from `0.0.0.0/0`
- Verify Nginx is running: `sudo systemctl status nginx`

### Certificate Already Exists

**Error:** `Certificate already exists`

**Solution:**
- If you want to renew: `sudo certbot renew`
- If you want to replace: `sudo certbot delete -d redtapepos.com.ng` then run script again

### Nginx Configuration Error

**Error:** `nginx: configuration file test failed`

**Solution:**
- Check Nginx config: `sudo nginx -t`
- View error logs: `sudo tail -f /var/log/nginx/error.log`
- Restore backup if needed: Check `/etc/nginx/sites-available/pos-backend.backup.*`

### Backend Not Accessible

**Error:** `502 Bad Gateway` or `Connection refused`

**Solution:**
- Check backend is running: `pm2 status`
- Check backend logs: `pm2 logs pos-backend`
- Verify backend is on port 3000: `curl http://localhost:3000/health`

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. The setup script configures auto-renewal, but you can manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

Test renewal (dry run):
```bash
sudo certbot renew --dry-run
```

## Manual Certificate Setup (Alternative)

If the automated script doesn't work, you can set up manually:

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d redtapepos.com.ng

# Follow the prompts
# Certbot will automatically configure Nginx
```

## Verification Checklist

After setup, verify:

- [ ] DNS points to server: `nslookup redtapepos.com.ng`
- [ ] HTTP redirects to HTTPS: `curl -I http://redtapepos.com.ng`
- [ ] HTTPS works: `curl https://redtapepos.com.ng/health`
- [ ] Certificate is valid: `curl -vI https://redtapepos.com.ng`
- [ ] Backend CORS updated: Check `.env` file
- [ ] Netlify env vars updated: Check Netlify dashboard
- [ ] Frontend can connect: Test login on Netlify site

## Support

If you encounter issues:
1. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`
3. Check backend logs: `pm2 logs pos-backend`
4. Verify DNS: `nslookup redtapepos.com.ng`
5. Test connectivity: `curl -v https://redtapepos.com.ng/health`

