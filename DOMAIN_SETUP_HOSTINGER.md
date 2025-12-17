# How to Connect Your Hostinger Domain to Azure & Google OAuth

**What you have**:
- ✅ Domain from Hostinger
- ✅ Azure VM at IP: `4.157.253.229`
- ✅ Application running on Azure

**What we'll do**:
- Point your domain to Azure VM
- Configure Google OAuth to use your domain
- Update application to use domain instead of IP

---

## Part 1: Point Domain to Azure VM (Hostinger)

### Step 1: Log in to Hostinger

1. Go to: https://hpanel.hostinger.com/
2. Log in with your credentials
3. Click on **Domains** in the left menu

### Step 2: Manage DNS

1. Find your domain (e.g., `yourdomain.com`)
2. Click **Manage** next to it
3. Look for **DNS / Name Servers** or **DNS Zone**
4. Click **DNS Zone Editor** or **Manage DNS**

### Step 3: Add A Record for Root Domain

Click **Add Record** or **Add New Record**:

**Type**: `A`
**Name**: `@` (or leave blank for root domain)
**Points to / Value**: `4.157.253.229`
**TTL**: `3600` (or default)

Click **Save** or **Add Record**

### Step 4: Add A Record for www

Click **Add Record** again:

**Type**: `A`
**Name**: `www`
**Points to / Value**: `4.157.253.229`
**TTL**: `3600`

Click **Save** or **Add Record**

### Step 5: Wait for DNS Propagation

- **Time**: 5 minutes to 48 hours (usually 15-30 minutes)
- **Check**: Open terminal and run:
  ```bash
  nslookup yourdomain.com
  # Should show: 4.157.253.229
  ```

---

## Part 2: Configure Google OAuth for Your Domain

### Step 1: Go to Google Cloud Console

https://console.cloud.google.com/apis/credentials

### Step 2: Edit OAuth Client

1. Find your OAuth 2.0 Client ID
2. Click the **edit** icon (pencil)

### Step 3: Update Authorized JavaScript Origins

**Remove** (or keep for testing):
```
http://4.157.253.229:3000
```

**Add** your domain:
```
http://yourdomain.com
http://www.yourdomain.com
https://yourdomain.com
https://www.yourdomain.com
```

**Keep** for local development:
```
http://localhost:5173
http://localhost:3000
```

### Step 4: Update Authorized Redirect URIs

**Remove** (or keep for testing):
```
http://4.157.253.229:3000
http://4.157.253.229:3000/login
```

**Add** your domain:
```
http://yourdomain.com
http://yourdomain.com/login
http://yourdomain.com/register
http://www.yourdomain.com
http://www.yourdomain.com/login
http://www.yourdomain.com/register
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/register
```

**Keep** for local development:
```
http://localhost:5173
http://localhost:5173/login
http://localhost:3000
```

Click **Save**

### Step 5: Update OAuth Consent Screen (Optional)

1. Go to **OAuth consent screen**
2. Under **Authorized domains**, add:
   ```
   yourdomain.com
   ```
3. Update **Application home page**: `http://yourdomain.com`
4. Click **Save and Continue**

---

## Part 3: Update Application Configuration

Now we need to tell your application to use the domain instead of the IP.

### Option A: Update via GitHub Secrets (Recommended)

1. Go to: https://github.com/Nakeerans/claudeproject/settings/secrets/actions

2. **Update or create** these secrets:

   **CLIENT_URL**:
   - Name: `CLIENT_URL`
   - Value: `http://yourdomain.com`

   **APP_URL** (if exists):
   - Name: `APP_URL`
   - Value: `http://yourdomain.com`

3. The next deployment will use these values

### Option B: Update Directly on Server (Quick Test)

SSH to your server:
```bash
ssh azureuser@4.157.253.229
cd /opt/jobtracker
```

Edit the environment file:
```bash
nano .env
```

Find and update:
```bash
CLIENT_URL=http://yourdomain.com
# Change from: CLIENT_URL=http://4.157.253.229:3000
```

Save and restart:
```bash
docker-compose down
docker-compose up -d
```

---

## Part 4: Test Your Setup

### Test 1: Domain Points to Azure

```bash
# From your computer
ping yourdomain.com
# Should show: 4.157.253.229

curl http://yourdomain.com:3000/health
# Should return: {"status":"healthy",...}
```

### Test 2: Application Works

1. Visit: `http://yourdomain.com:3000`
2. You should see your JobFlow application
3. If not, wait 15 more minutes for DNS propagation

### Test 3: Google OAuth Works

1. Visit: `http://yourdomain.com:3000/login`
2. Click "Continue with Google"
3. Should open Google sign-in popup
4. Sign in successfully
5. ✅ Redirected to dashboard

---

## Part 5: Remove Port :3000 (Optional but Recommended)

Right now users need to type `:3000`. Let's fix that!

### Option 1: Use Nginx Reverse Proxy (Recommended)

SSH to server:
```bash
ssh azureuser@4.157.253.229
```

Install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

Create config:
```bash
sudo nano /etc/nginx/sites-available/jobflow
```

Paste this:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Replace `yourdomain.com` with your actual domain!

Enable and start:
```bash
sudo ln -s /etc/nginx/sites-available/jobflow /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

Now visit: `http://yourdomain.com` (no port needed!)

### Option 2: Change Docker Port Mapping

Edit docker-compose.yml:
```bash
cd /opt/jobtracker
nano docker-compose.yml
```

Find:
```yaml
ports:
  - "3000:3000"
```

Change to:
```yaml
ports:
  - "80:3000"
```

Restart:
```bash
docker-compose down
docker-compose up -d
```

Now visit: `http://yourdomain.com` (no port!)

---

## Part 6: Add HTTPS (Highly Recommended for Production)

### Why HTTPS?
- ✅ Secure (encrypted)
- ✅ Google OAuth prefers HTTPS
- ✅ Professional
- ✅ Better SEO
- ✅ **FREE with Let's Encrypt**

### Using Certbot (FREE SSL)

If you used Nginx (Option 1 above):

```bash
ssh azureuser@4.157.253.229

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get FREE SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email: your@email.com
# - Agree to terms: Y
# - Redirect HTTP to HTTPS: Y (recommended)
```

**That's it!** Your site is now at: `https://yourdomain.com` 🎉

### Update Google OAuth for HTTPS

Go back to Google Cloud Console:
1. **Authorized JavaScript origins**:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

2. **Authorized redirect URIs**:
   ```
   https://yourdomain.com/login
   https://yourdomain.com/register
   ```

3. Save

---

## Quick Reference

### Your Setup After Configuration:

| What | Before | After |
|------|--------|-------|
| **URL** | `http://4.157.253.229:3000` | `http://yourdomain.com` |
| **With SSL** | N/A | `https://yourdomain.com` |
| **Google OAuth** | Uses IP | Uses domain |
| **Professional** | ❌ | ✅ |

### DNS Records in Hostinger:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 4.157.253.229 | 3600 |
| A | www | 4.157.253.229 | 3600 |

### Google OAuth URLs:

**Authorized JavaScript origins**:
- `https://yourdomain.com`
- `https://www.yourdomain.com`
- `http://localhost:5173` (for dev)

**Authorized redirect URIs**:
- `https://yourdomain.com/login`
- `https://yourdomain.com/register`
- `http://localhost:5173/login` (for dev)

---

## Troubleshooting

### Domain doesn't work yet

**Cause**: DNS not propagated
**Solution**:
- Wait 15-30 minutes
- Clear browser cache
- Try incognito mode
- Check: `nslookup yourdomain.com`

### Google OAuth shows redirect_uri_mismatch

**Cause**: Domain not in authorized URIs
**Solution**:
1. Copy exact URL from error message
2. Add to Google Cloud Console
3. Wait 2-3 minutes
4. Try again

### SSL certificate fails

**Cause**: DNS not pointing to server yet
**Solution**:
- Make sure `yourdomain.com` resolves to `4.157.253.229`
- Wait for DNS propagation
- Try certbot again

### Port :3000 still required

**Cause**: Nginx not configured or Docker port not changed
**Solution**:
- Check Nginx is running: `sudo systemctl status nginx`
- Or change Docker port to 80
- Restart services

---

## Example with Real Domain

Let's say your domain is: **jobflow.tech**

### Hostinger DNS:
```
A    @      →  4.157.253.229
A    www    →  4.157.253.229
```

### Google OAuth:
```
Authorized origins:
  https://jobflow.tech
  https://www.jobflow.tech

Redirect URIs:
  https://jobflow.tech/login
  https://jobflow.tech/register
```

### Final URL:
```
https://jobflow.tech
```

---

## Next Steps

1. **Now**: Set up DNS in Hostinger (5 min)
2. **Wait**: 15-30 min for DNS propagation
3. **Then**: Configure Google OAuth with domain
4. **Then**: Set up Nginx reverse proxy
5. **Finally**: Add HTTPS with Let's Encrypt (FREE!)

**Total time**: ~1 hour (mostly waiting for DNS)

---

## What's Your Domain?

**Tell me your domain name** and I can:
1. Give you exact DNS records to add
2. Provide exact Google OAuth URLs
3. Update the application configuration
4. Create Nginx config with your domain

Just reply with: **"My domain is: yourdomain.com"**

---

**Created by Claude Code** 🤖
**For Hostinger domain → Azure VM → Google OAuth**
