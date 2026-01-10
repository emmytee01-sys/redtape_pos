# Deployment Guide - RedTap POS

## Frontend Deployment to Netlify

### Prerequisites
- GitHub repository pushed and up to date
- Netlify account
- Backend server running and accessible

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### Step 2: Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
5. Click "Deploy site"

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

### Step 3: Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:

```
VITE_API_URL=http://98.92.181.124:3000/api
VITE_BACKEND_URL=http://98.92.181.124:3000
```

**Note:** After deployment, update `VITE_API_URL` to use your backend URL (could be ngrok URL or your server IP).

### Step 4: Update Backend CORS

On your backend server, update the `.env` file:

```bash
ssh -i Emmy.pem ubuntu@98.92.181.124
cd ~/redtap-pos/backend
nano .env
```

Update `CORS_ORIGIN` to include your Netlify URL:
```
CORS_ORIGIN=http://localhost:5173,https://your-app.netlify.app
```

Then restart the backend:
```bash
npm run build
pm2 restart pos-backend
```

### Step 5: Verify Deployment

1. Visit your Netlify URL (e.g., `https://your-app.netlify.app`)
2. Test login functionality
3. Verify API calls are working
4. Check browser console for any errors

## Backend Deployment

The backend is already deployed and running on the server with PM2.

### Current Backend URL
- **Production:** `http://98.92.181.124:3000`
- **API Base:** `http://98.92.181.124:3000/api`

### Backend Management Commands

```bash
# SSH into server
ssh -i Emmy.pem ubuntu@98.92.181.124

# Check backend status
pm2 status

# View logs
pm2 logs pos-backend

# Restart backend
cd ~/redtap-pos/backend
git pull
npm run build
pm2 restart pos-backend

# Stop backend
pm2 stop pos-backend

# Start backend
pm2 start pos-backend
```

## Using Ngrok (Optional - for Development/Testing)

If you need temporary public URLs for testing:

### Backend Tunnel
```bash
ngrok http 3000
# Use the provided HTTPS URL as VITE_API_URL
```

### Frontend Tunnel
```bash
ngrok http 5173
# Use the provided HTTPS URL to access frontend
```

**Note:** Free ngrok URLs change on restart. For production, use a fixed domain or your server IP.

## Troubleshooting

### Frontend Build Issues
- Ensure all TypeScript errors are fixed: `npm run build`
- Check that all dependencies are installed: `npm install`

### API Connection Issues
- Verify backend is running: `curl http://98.92.181.124:3000/health`
- Check CORS configuration in backend `.env`
- Verify environment variables in Netlify are set correctly

### Receipt Download Issues
- Ensure `VITE_BACKEND_URL` is set correctly
- Check that backend static file serving is configured correctly
- Verify receipt files are being generated in `backend/receipts/`

## Files Created for Deployment

- `frontend/netlify.toml` - Netlify build configuration
- `frontend/public/_redirects` - SPA routing redirects
- Updated `frontend/src/services/api.ts` - Dynamic API URL based on environment
- Updated `frontend/src/pages/Payments.tsx` - Dynamic backend URL for receipts

## Next Steps

1. Deploy frontend to Netlify
2. Set environment variables in Netlify
3. Update backend CORS with Netlify URL
4. Test the complete workflow
5. Consider setting up a domain name for better URLs

