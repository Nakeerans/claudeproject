# Automated Nginx & SSL Setup via GitHub Actions

**You were right!** Instead of manual SSH commands, everything is now automated in the deployment workflow.

---

## What's Automated Now ✅

The deployment workflow now automatically:

1. ✅ **Installs Nginx** (if not already installed)
2. ✅ **Configures reverse proxy** (removes :3000 from URL)
3. ✅ **Sets up SSL certificate** (FREE HTTPS with Let's Encrypt)
4. ✅ **Enables auto-renewal** (SSL renews automatically)
5. ✅ **Updates on every deployment** (configuration always current)

**No more manual SSH commands needed!**

---

## How to Enable (Simple Steps)

### Step 1: Update DNS (You do this once)

In Hostinger, update your A record:
- Type: `A`
- Name: `@`
- Value: `4.157.253.229`
- Save

Wait 15-30 minutes for DNS propagation.

### Step 2: Add GitHub Secrets

Go to: https://github.com/Nakeerans/claudeproject/settings/secrets/actions

Add these secrets:

#### Required Secrets:

**DOMAIN_NAME**
- Name: `DOMAIN_NAME`
- Value: `dusti.pro`
- Click "Add secret"

**VITE_GOOGLE_CLIENT_ID**
- Name: `VITE_GOOGLE_CLIENT_ID`
- Value: Your Google Client ID
- Click "Add secret"

**GOOGLE_CLIENT_ID**
- Name: `GOOGLE_CLIENT_ID`
- Value: Same Google Client ID
- Click "Add secret"

#### Optional Secrets:

**SSL_EMAIL** (for SSL certificate notifications)
- Name: `SSL_EMAIL`
- Value: `your-email@gmail.com`
- Click "Add secret"

If you don't add `SSL_EMAIL`, it will use `admin@dusti.pro`

### Step 3: Deploy!

The deployment workflow will automatically run when you push to main:

```bash
git commit --allow-empty -m "Deploy with automated Nginx and SSL"
git push
```

Or trigger manually:
1. Go to **Actions** tab on GitHub
2. Click **Deploy Application to Azure**
3. Click **Run workflow**
4. Click green **Run workflow** button

### Step 4: Wait (5-10 minutes)

The workflow will:
1. Deploy your code ✅
2. Install/configure Nginx ✅
3. Get SSL certificate ✅
4. Configure auto-renewal ✅

Watch the workflow logs to see progress!

---

## What Happens Automatically

### During Deployment:

```
📦 Deploy code to Azure
⬇️  Install Nginx (if needed)
🔧 Configure reverse proxy
📝 Create Nginx config for dusti.pro
✅ Test Nginx configuration
🔄 Restart Nginx
🔒 Install Certbot (if needed)
🎫 Get SSL certificate from Let's Encrypt
✅ Configure HTTPS redirect
⏰ Enable auto-renewal
🎉 Done!
```

### After Deployment:

Your application is available at:
- `https://dusti.pro` ← **Main URL (HTTPS)**
- `http://dusti.pro` ← **Redirects to HTTPS**
- `https://www.dusti.pro` ← **Also works**

No more `:3000` port needed!

---

## Verification

After deployment completes, test:

### Test 1: HTTP → HTTPS Redirect
```bash
curl -I http://dusti.pro
# Should show: 301 or 302 redirect to https://dusti.pro
```

### Test 2: HTTPS Works
```bash
curl https://dusti.pro/health
# Should return: {"status":"healthy",...}
```

### Test 3: Browser
Visit: `https://dusti.pro`
- ✅ See green padlock 🔒
- ✅ Certificate is valid
- ✅ Application loads

---

## What's in the Workflow

### Nginx Setup Step

```yaml
- name: Setup Nginx reverse proxy
  run: |
    # Installs Nginx if not present
    # Creates configuration for your domain
    # Enables and starts Nginx
    # Removes :3000 from URL
```

### SSL Setup Step

```yaml
- name: Setup SSL certificate (if domain configured)
  run: |
    # Installs Certbot if not present
    # Gets FREE SSL certificate
    # Configures HTTPS
    # Sets up auto-renewal
```

**Smart features:**
- Only runs if `DOMAIN_NAME` secret exists
- Skips SSL if DNS not ready (continues deployment)
- Uses `continue-on-error` so deployment doesn't fail if SSL temporarily fails

---

## GitHub Secrets You Need

| Secret Name | Example Value | Required | Purpose |
|-------------|---------------|----------|---------|
| `DOMAIN_NAME` | `dusti.pro` | **YES** | Your domain |
| `VITE_GOOGLE_CLIENT_ID` | `123...apps.googleusercontent.com` | **YES** | Google OAuth (frontend) |
| `GOOGLE_CLIENT_ID` | Same as above | **YES** | Google OAuth (backend) |
| `SSL_EMAIL` | `your@email.com` | Optional | SSL notifications |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Optional | Google OAuth (future) |

---

## Troubleshooting

### SSL certificate fails

**Error in logs**: `Failed to obtain certificate`

**Causes**:
1. DNS not propagated yet
2. Domain doesn't point to server

**Solution**:
```bash
# Check DNS
nslookup dusti.pro
# Should show: 4.157.253.229

# If not, wait 30 more minutes and redeploy
git commit --allow-empty -m "Retry SSL setup"
git push
```

### Nginx config error

**Error in logs**: `nginx: configuration file test failed`

**Solution**:
- Check workflow logs for specific error
- The workflow automatically validates config before applying
- If it fails, old config remains active

### Domain still shows :3000

**Causes**:
1. Nginx not started
2. Using direct IP instead of domain

**Solution**:
```bash
# SSH to server
ssh azureuser@4.157.253.229

# Check Nginx status
sudo systemctl status nginx

# Restart if needed
sudo systemctl restart nginx

# Visit domain (not IP):
# ✅ https://dusti.pro
# ❌ http://4.157.253.229:3000
```

---

## Manual Override (If Needed)

If you need to manually edit Nginx config:

```bash
ssh azureuser@4.157.253.229
sudo nano /etc/nginx/sites-available/jobflow
# Make changes
sudo nginx -t  # Test
sudo systemctl reload nginx  # Apply
```

**Note**: Next deployment will overwrite manual changes!

---

## SSL Auto-Renewal

The workflow enables Certbot's auto-renewal timer.

Certificates automatically renew every 60 days.

Check renewal status:
```bash
ssh azureuser@4.157.253.229
sudo systemctl status certbot.timer
sudo certbot renew --dry-run  # Test renewal
```

---

## Comparison: Before vs After

### Before (Manual):
```bash
# You had to SSH and run:
ssh azureuser@4.157.253.229
sudo apt install nginx
sudo nano /etc/nginx/sites-available/...
# ... many manual steps ...
sudo certbot --nginx ...
# Repeat on every server change
```

### After (Automated):
```bash
# Just add secrets once:
- DOMAIN_NAME = dusti.pro
- VITE_GOOGLE_CLIENT_ID = your_id

# Then deploy:
git push

# Done! ✅
```

---

## Benefits

✅ **No SSH needed** - Everything automated
✅ **No manual commands** - Workflow does it all
✅ **Repeatable** - Works every deployment
✅ **Safe** - Tests config before applying
✅ **Idempotent** - Can run multiple times safely
✅ **Self-healing** - Reinstalls if something breaks
✅ **Version controlled** - Configuration in Git
✅ **Easy to update** - Just edit workflow file

---

## Next Steps

1. ✅ Update DNS in Hostinger (A record → 4.157.253.229)
2. ✅ Add GitHub Secrets (`DOMAIN_NAME`, `VITE_GOOGLE_CLIENT_ID`)
3. ✅ Push to deploy (or trigger manually)
4. ✅ Wait 5-10 minutes
5. ✅ Visit https://dusti.pro
6. ✅ Enjoy your automated setup!

---

## What If DNS Isn't Ready?

No problem! The workflow is smart:

- If DNS not ready:
  - ✅ Nginx still configures (uses IP as fallback)
  - ⚠️ SSL skipped (continues-on-error)
  - ✅ Application works at `http://4.157.253.229`

- When DNS is ready:
  - Just redeploy
  - ✅ SSL will work
  - ✅ Domain works

---

**Everything automated!** No more manual SSH configuration needed.

Just add secrets, push, and deploy! 🚀

---

**Created by Claude Code** 🤖
**Automated Nginx & SSL Setup for dusti.pro**
