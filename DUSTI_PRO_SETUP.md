# Complete Setup Guide for dusti.pro

Your domain: **dusti.pro**
Your Azure VM: **4.157.253.229**

---

## ✅ Step 1: DNS Configuration (Hostinger)

### Current DNS:
```
A       @      84.32.84.32    3600
CNAME   www    dusti.pro      300
```

### Update to:
```
A       @      4.157.253.229  3600   ← CHANGE THIS
CNAME   www    dusti.pro      300    ← KEEP AS IS
```

### How to Update:
1. In Hostinger DNS Manager
2. Find A record for `@` with value `84.32.84.32`
3. Click **Edit**
4. Change value to: `4.157.253.229`
5. Click **Save**
6. Keep the CNAME record as is (no changes needed)

### Wait:
- **5-30 minutes** for DNS propagation
- Test: `nslookup dusti.pro` should show `4.157.253.229`

---

## ✅ Step 2: Google OAuth Configuration

### Go to:
https://console.cloud.google.com/apis/credentials

### Edit your OAuth 2.0 Client ID

#### Authorized JavaScript origins:
```
https://dusti.pro
https://www.dusti.pro
http://dusti.pro
http://www.dusti.pro
http://localhost:5173
http://localhost:3000
```

#### Authorized redirect URIs:
```
https://dusti.pro/login
https://dusti.pro/register
https://www.dusti.pro/login
https://www.dusti.pro/register
http://dusti.pro/login
http://dusti.pro/register
http://localhost:5173/login
http://localhost:3000/login
```

Click **Save**

---

## ✅ Step 3: Set Up Nginx Reverse Proxy

This removes the `:3000` from your URL!

### SSH to Server:
```bash
ssh azureuser@4.157.253.229
```

### Install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

### Create Config File:
```bash
sudo nano /etc/nginx/sites-available/dusti-pro
```

### Paste This Configuration:
```nginx
server {
    listen 80;
    server_name dusti.pro www.dusti.pro;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save: **Ctrl+X**, **Y**, **Enter**

### Enable the Site:
```bash
sudo ln -s /etc/nginx/sites-available/dusti-pro /etc/nginx/sites-enabled/
```

### Remove Default Site (Optional):
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Test Configuration:
```bash
sudo nginx -t
```

Should say: `syntax is ok` and `test is successful`

### Start Nginx:
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Test It:
```bash
# From server
curl http://localhost/health

# From your computer
curl http://dusti.pro/health
```

Both should return: `{"status":"healthy"...}`

---

## ✅ Step 4: Add FREE SSL Certificate (HTTPS)

### Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate:
```bash
sudo certbot --nginx -d dusti.pro -d www.dusti.pro
```

### Follow Prompts:
1. Enter email: `your-email@gmail.com`
2. Agree to terms: `Y`
3. Share email (optional): `N`
4. Redirect HTTP to HTTPS: `2` (Yes, recommended)

### Auto-Renewal:
Certbot automatically sets up renewal. Test it:
```bash
sudo certbot renew --dry-run
```

---

## ✅ Step 5: Update Application Configuration

### Option A: Via GitHub Secrets (Recommended)

Go to: https://github.com/Nakeerans/claudeproject/settings/secrets/actions

Update or create:
- **CLIENT_URL**: `https://dusti.pro`

Then push to deploy:
```bash
git commit --allow-empty -m "Update to dusti.pro domain"
git push
```

### Option B: Update Directly on Server

SSH to server:
```bash
ssh azureuser@4.157.253.229
cd /opt/jobtracker
nano .env
```

Update:
```bash
CLIENT_URL=https://dusti.pro
```

Save and restart:
```bash
docker-compose down
docker-compose up -d
```

---

## ✅ Step 6: Update Google OAuth for HTTPS

Go back to Google Cloud Console:

### Authorized JavaScript origins:
```
https://dusti.pro
https://www.dusti.pro
```

### Authorized redirect URIs:
```
https://dusti.pro/login
https://dusti.pro/register
https://www.dusti.pro/login
https://www.dusti.pro/register
```

Remove the `http://` versions after SSL is working.

---

## 🎉 Final Result

### Your URLs:
- **Application**: `https://dusti.pro`
- **Login**: `https://dusti.pro/login`
- **With www**: `https://www.dusti.pro`

### What Works:
- ✅ Clean domain (no IP, no port)
- ✅ SSL/HTTPS (secure, green padlock)
- ✅ Google OAuth
- ✅ Professional URL
- ✅ Automatic www redirect

---

## Testing Checklist

After completing all steps:

- [ ] `nslookup dusti.pro` shows `4.157.253.229`
- [ ] `http://dusti.pro` redirects to `https://dusti.pro`
- [ ] `https://dusti.pro` shows your application
- [ ] `https://www.dusti.pro` also works
- [ ] Green padlock (SSL) in browser
- [ ] Login page has "Continue with Google" button
- [ ] Google OAuth works (can sign in)
- [ ] No `:3000` port needed

---

## Quick Commands Reference

### Check DNS:
```bash
nslookup dusti.pro
dig dusti.pro
```

### Check Application:
```bash
curl https://dusti.pro/health
```

### Check Nginx:
```bash
sudo systemctl status nginx
sudo nginx -t
```

### View Nginx Logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services:
```bash
# Nginx
sudo systemctl restart nginx

# Application
cd /opt/jobtracker
docker-compose restart
```

---

## Timeline

| Step | Time | What |
|------|------|------|
| DNS Update | 2 min | Change A record |
| DNS Propagation | 15-30 min | Wait |
| Nginx Setup | 5 min | Install & configure |
| SSL Certificate | 3 min | Let's Encrypt |
| Google OAuth | 5 min | Update URLs |
| **Total** | **~30-45 min** | Including wait time |

---

## Support

If something doesn't work:

1. **DNS not working?**
   - Wait longer (up to 1 hour)
   - Clear browser cache
   - Try different network

2. **Nginx errors?**
   - Check: `sudo nginx -t`
   - View logs: `sudo tail -f /var/log/nginx/error.log`

3. **SSL fails?**
   - Make sure DNS points to server first
   - Check: `nslookup dusti.pro`
   - Try certbot again after DNS works

4. **Google OAuth fails?**
   - Check exact URLs in Google Console
   - Must match `https://dusti.pro` exactly
   - Wait 2-3 minutes after updating

---

**Your domain: dusti.pro**
**Ready to make it live!** 🚀

---

Created by Claude Code 🤖
