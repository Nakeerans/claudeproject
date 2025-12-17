# How to Add Google OAuth to GitHub Secrets

**Time**: 5 minutes after you get your Google Client ID

---

## Step 1: Get Your Google Client ID (if you don't have it yet)

Follow: `QUICK_START_GOOGLE_OAUTH.md` (Steps 1-3)

You'll get a Client ID that looks like:
```
123456789-abcdefghijk.apps.googleusercontent.com
```

---

## Step 2: Add to GitHub Secrets

### Go to Repository Settings:
```
https://github.com/Nakeerans/claudeproject/settings/secrets/actions
```

Or navigate:
1. Go to your repo on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

---

## Step 3: Add These Secrets

Click **"New repository secret"** for each:

### Secret 1: VITE_GOOGLE_CLIENT_ID (Frontend)
- **Name**: `VITE_GOOGLE_CLIENT_ID`
- **Value**: Paste your Client ID
  ```
  123456789-abcdefghijk.apps.googleusercontent.com
  ```
- Click **Add secret**

### Secret 2: GOOGLE_CLIENT_ID (Backend - same value)
- **Name**: `GOOGLE_CLIENT_ID`
- **Value**: Paste the SAME Client ID
  ```
  123456789-abcdefghijk.apps.googleusercontent.com
  ```
- Click **Add secret**

### Secret 3: GOOGLE_CLIENT_SECRET (Backend - optional)
- **Name**: `GOOGLE_CLIENT_SECRET`
- **Value**: Paste your Client Secret (from Google Cloud Console)
  ```
  GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
  ```
- Click **Add secret**

**Note**: Client Secret is optional for our current implementation, but good to have for future features.

---

## Step 4: Trigger Deployment

After adding secrets, deploy:

### Option A: Push any change
```bash
git commit --allow-empty -m "Trigger deployment with Google OAuth"
git push
```

### Option B: Manual workflow trigger
1. Go to **Actions** tab
2. Click **Deploy Application to Azure**
3. Click **Run workflow**
4. Click **Run workflow** button

---

## Step 5: Verify It Works

After deployment (3-5 minutes):

1. Visit: http://4.157.253.229:3000/login
2. You should see **"Continue with Google"** button
3. Click it
4. Sign in with Google
5. ✅ You're logged in!

---

## What Happens Behind the Scenes

The deployment workflow will:
1. ✅ Create `/opt/jobtracker/.env` with `GOOGLE_CLIENT_ID`
2. ✅ Create `/opt/jobtracker/client/.env` with `VITE_GOOGLE_CLIENT_ID`
3. ✅ Build the frontend with environment variable
4. ✅ Start Docker containers with secrets
5. ✅ Google OAuth button appears!

---

## Current Secrets You Need

| Secret Name | Used By | Required? | Example Value |
|-------------|---------|-----------|---------------|
| `VITE_GOOGLE_CLIENT_ID` | Frontend | **YES** | `123456...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_ID` | Backend | **YES** | Same as above |
| `GOOGLE_CLIENT_SECRET` | Backend | Optional | `GOCSPX-...` |

---

## Troubleshooting

### Button still doesn't appear after deployment

**Check**:
1. Did you add `VITE_GOOGLE_CLIENT_ID` secret? (not just `GOOGLE_CLIENT_ID`)
2. Did deployment succeed? Check Actions tab
3. Clear browser cache and refresh

**Verify on server**:
```bash
ssh azureuser@4.157.253.229
cat /opt/jobtracker/client/.env
# Should show: VITE_GOOGLE_CLIENT_ID=your_id
```

### "Missing client_id" error

The secret name must be **exactly**: `VITE_GOOGLE_CLIENT_ID`
- ✅ Correct: `VITE_GOOGLE_CLIENT_ID`
- ❌ Wrong: `GOOGLE_CLIENT_ID` (this is for backend only)
- ❌ Wrong: `VUE_GOOGLE_CLIENT_ID`

---

## Summary

✅ **Proper solution** (not conditional rendering):
1. Get Google Client ID from Google Cloud Console
2. Add to GitHub Secrets
3. Deployment automatically injects it
4. Google OAuth works!

This is the **right way** to configure Google OAuth - using secrets management, not hiding the button!

---

**Created by Claude Code** 🤖
