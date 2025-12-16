# Quick Start: Enable Google OAuth (5 Steps)

**Time Required**: 15-30 minutes
**Current Status**: Code deployed, credentials needed

---

## Step 1: Create Google Cloud Project (5 min)

1. Visit: https://console.cloud.google.com/
2. Click "New Project"
3. Name: "JobFlow" → Create
4. Wait for creation

---

## Step 2: Configure OAuth Consent (5 min)

1. Go to: **APIs & Services** → **OAuth consent screen**
2. Select: **External** → Create
3. Fill in:
   - App name: **JobFlow**
   - User support email: **your-email@gmail.com**
   - Developer email: **your-email@gmail.com**
4. Click: **Save and Continue** (3 times)
5. Done!

---

## Step 3: Create Credentials (5 min)

1. Go to: **APIs & Services** → **Credentials**
2. Click: **Create Credentials** → **OAuth client ID**
3. Type: **Web application**
4. Name: **JobFlow Web**

5. **Authorized JavaScript origins**:
   ```
   http://4.157.253.229:3000
   http://localhost:5173
   ```

6. **Authorized redirect URIs**:
   ```
   http://4.157.253.229:3000/login
   http://localhost:5173/login
   ```

7. Click: **Create**
8. **COPY** the Client ID (looks like: `123456-abc.apps.googleusercontent.com`)

---

## Step 4: Add to Azure (Local - 10 min)

### If Testing Locally:

Create `client/.env`:
```bash
VITE_GOOGLE_CLIENT_ID=paste_your_client_id_here
```

Create `.env` (if not exists):
```bash
GOOGLE_CLIENT_ID=paste_your_client_id_here
```

Restart:
```bash
npm run dev
```

### For Azure Production:

SSH to server:
```bash
ssh azureuser@4.157.253.229
cd /opt/jobtracker
```

Edit environment:
```bash
nano .env
```

Add this line:
```bash
GOOGLE_CLIENT_ID=paste_your_client_id_here
```

Save (Ctrl+X, Y, Enter)

Restart:
```bash
docker-compose down
docker-compose up -d --build
```

---

## Step 5: Test It! (2 min)

1. Visit: http://4.157.253.229:3000/login (or http://localhost:5173/login)
2. Look for "Continue with Google" button
3. Click it
4. Sign in with your Google account
5. ✅ You should be logged in!

---

## Troubleshooting

### Button doesn't appear
- Check: `VITE_GOOGLE_CLIENT_ID` is set
- Restart dev server
- Clear browser cache

### "redirect_uri_mismatch" error
- Go back to Google Cloud Console
- Add the exact URI from error message
- Wait 2-3 minutes
- Try again

### "access_blocked" error
- Go to: OAuth consent screen
- Add your email to "Test users"
- Try again

---

## Done!

✅ Google OAuth is now working!

**What works**:
- Sign in with Google button
- One-Tap sign-in
- Automatic user creation
- Profile from Google

**Need more help?**
- Full guide: `GOOGLE_OAUTH_SETUP.md`
- Summary: `GOOGLE_OAUTH_SUMMARY.md`

---

**Quick start by Claude Code** 🤖
