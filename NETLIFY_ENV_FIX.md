# Fix Netlify Environment Variables for HTTPS

## Problem
Your Netlify deployment is still using the old HTTP URL with port 3000, causing `ERR_SSL_PROTOCOL_ERROR`.

## Solution: Update Netlify Environment Variables

### Step 1: Open Netlify Dashboard
1. Go to https://app.netlify.com/
2. Select your site: **redtapepos** (or your site name)
3. Click **Site settings** (gear icon)
4. Click **Environment variables** in the left sidebar

### Step 2: Update or Add Variables

**Find and update these variables:**

| Variable Name | OLD Value (Wrong) | NEW Value (Correct) |
|---------------|-------------------|---------------------|
| `VITE_API_URL` | `http://98.92.181.124:3000/api` | `https://98.92.181.124/api` |
| `VITE_BACKEND_URL` | `http://98.92.181.124:3000` | `https://98.92.181.124` |

**Key changes:**
- ✅ Change `http://` → `https://`
- ✅ Remove `:3000` port (HTTPS uses port 443 by default)

### Step 3: Save and Redeploy

1. **Save** the environment variables
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. Wait for the deployment to complete (~2-3 minutes)

### Step 4: Verify

After deployment, test your login:
- The URL should be: `https://98.92.181.124/api/auth/login`
- NOT: `https://98.92.181.124:3000/api/auth/login`

## Alternative: Remove Environment Variables

If you prefer to use the code defaults:
1. Delete `VITE_API_URL` and `VITE_BACKEND_URL` from Netlify
2. The code will use the defaults: `https://98.92.181.124/api`
3. Redeploy

## Why This Happens

Vite environment variables (prefixed with `VITE_`) are **baked into the build** at build time. Even though we updated the code, the old values in Netlify override the defaults. You must either:
- Update the Netlify env vars, OR
- Delete them and use code defaults

Both require a new deployment to take effect.

