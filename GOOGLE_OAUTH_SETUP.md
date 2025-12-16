# Google OAuth Setup Guide

Complete guide to set up Google OAuth authentication for JobFlow.

---

## Overview

Google OAuth allows users to sign in using their Google account instead of creating a password. This provides:
- ✅ Faster registration and login
- ✅ Better security (no password to manage)
- ✅ Automatic profile information (name, email, avatar)
- ✅ One-Tap sign-in experience

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create a New Project
1. Click the project dropdown at the top
2. Click "New Project"
3. Enter project name: `JobFlow` (or your app name)
4. Click "Create"

### 1.3 Wait for Project Creation
This usually takes a few seconds.

---

## Step 2: Enable Google OAuth API

### 2.1 Navigate to APIs & Services
1. In the left sidebar, click "APIs & Services"
2. Click "Library"

### 2.2 Enable Google+ API (Optional)
1. Search for "Google+ API"
2. Click on it
3. Click "Enable"

**Note**: This API is deprecated but may still be needed for some features. The main OAuth works without it.

---

## Step 3: Configure OAuth Consent Screen

### 3.1 Navigate to OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"

### 3.2 Choose User Type
- **For Testing/Development**: Select "External" (recommended)
- **For Production**: Select "Internal" (if using Google Workspace) or "External"
- Click "Create"

### 3.3 Fill in App Information

**App Information**:
- **App name**: `JobFlow` (or your app name)
- **User support email**: Your email address
- **App logo**: (Optional) Upload your app logo

**App Domain** (Optional but recommended for production):
- **Application home page**: `http://4.157.253.229:3000` (or your domain)
- **Application privacy policy link**: Your privacy policy URL
- **Application terms of service link**: Your terms URL

**Authorized Domains**:
Add your domains (for production):
- `yourdomain.com` (if you have one)

**Developer Contact Information**:
- Enter your email address

Click "Save and Continue"

### 3.4 Scopes
1. Click "Add or Remove Scopes"
2. Select these scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
3. Click "Update"
4. Click "Save and Continue"

### 3.5 Test Users (for External type in Testing mode)
1. Click "Add Users"
2. Enter email addresses of people who can test
3. Click "Add"
4. Click "Save and Continue"

### 3.6 Summary
Review and click "Back to Dashboard"

---

## Step 4: Create OAuth 2.0 Credentials

### 4.1 Navigate to Credentials
1. Go to "APIs & Services" → "Credentials"

### 4.2 Create OAuth Client ID
1. Click "Create Credentials" → "OAuth client ID"
2. **Application type**: Select "Web application"
3. **Name**: `JobFlow Web Client` (or any name)

### 4.3 Configure Authorized Origins
Add these URLs (one per line):

**For Development**:
```
http://localhost:3000
http://localhost:5173
```

**For Production (Azure)**:
```
http://4.157.253.229:3000
```

**If you have a custom domain**:
```
https://yourdomain.com
```

### 4.4 Configure Authorized Redirect URIs
Add these URLs (one per line):

**For Development**:
```
http://localhost:3000
http://localhost:5173
http://localhost:3000/login
http://localhost:5173/login
```

**For Production (Azure)**:
```
http://4.157.253.229:3000
http://4.157.253.229:3000/login
http://4.157.253.229:3000/register
```

**If you have a custom domain**:
```
https://yourdomain.com
https://yourdomain.com/login
https://yourdomain.com/register
```

### 4.5 Create and Save Credentials
1. Click "Create"
2. A popup will show your credentials
3. **Copy the Client ID** - you'll need this!
4. **Copy the Client Secret** - you'll need this too!
5. Click "OK"

---

## Step 5: Configure Environment Variables

### 5.1 Backend Configuration

Edit `/Users/nakeeransaravanan/Devops_practise/claudeproject/.env`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

**Example**:
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 5.2 Frontend Configuration

Edit `/Users/nakeeransaravanan/Devops_practise/claudeproject/client/.env`:

```bash
# Google OAuth Client ID (Frontend)
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
```

**Example**:
```bash
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**IMPORTANT**: Only add the Client ID to the frontend, NOT the Client Secret!

---

## Step 6: Update Azure Production Environment

### 6.1 SSH to Azure VM
```bash
ssh azureuser@4.157.253.229
```

### 6.2 Navigate to App Directory
```bash
cd /opt/jobtracker
```

### 6.3 Edit Environment File
```bash
nano .env
```

Add these lines:
```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

Save and exit (Ctrl+X, Y, Enter)

### 6.4 Edit Frontend Environment (if using docker-compose with client)
```bash
nano client/.env
```

Add:
```bash
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
```

Save and exit

### 6.5 Restart Application
```bash
docker-compose down
docker-compose up -d --build
```

### 6.6 Verify Deployment
```bash
docker-compose logs -f app
curl http://localhost:3000/health
```

---

## Step 7: Testing

### 7.1 Test Locally
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:5173/login`

3. You should see a "Continue with Google" button

4. Click it and test the flow

### 7.2 Test on Production
1. Visit: `http://4.157.253.229:3000/login`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Verify you're redirected to the dashboard

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: The redirect URI doesn't match what's configured in Google Cloud Console

**Solution**:
1. Check the error message for the actual redirect URI being used
2. Add that exact URI to "Authorized redirect URIs" in Google Cloud Console
3. Wait a few minutes for changes to propagate
4. Try again

### Error: "access_blocked"
**Cause**: The app is in testing mode and the user isn't added as a test user

**Solution**:
1. Go to OAuth consent screen in Google Cloud Console
2. Add the user's email to "Test users"
3. Or publish the app (review required)

### Error: "idpiframe_initialization_failed"
**Cause**: Cookies are blocked or third-party cookies disabled

**Solution**:
- Enable third-party cookies in browser settings
- Or use Incognito/Private mode
- Or add your domain to cookie exceptions

### Error: "popup_closed_by_user"
**Cause**: User closed the popup before completing authentication

**Solution**:
- This is normal user behavior, just a warning
- No action needed

### Google Button Not Appearing
**Possible Causes**:
1. VITE_GOOGLE_CLIENT_ID not set
2. Client ID incorrect
3. JavaScript error

**Solution**:
1. Check browser console for errors
2. Verify VITE_GOOGLE_CLIENT_ID in client/.env
3. Restart dev server after changing .env
4. Clear browser cache

### Backend Token Verification Fails
**Cause**: Client ID mismatch or invalid token

**Solution**:
1. Verify GOOGLE_CLIENT_ID matches in frontend and backend
2. Check server logs: `docker-compose logs -f app`
3. Ensure token isn't expired (Google tokens expire after ~1 hour)

---

## Security Best Practices

### 1. Keep Client Secret Secure
- ✅ Never commit .env files to git (use .gitignore)
- ✅ Never expose Client Secret in frontend code
- ✅ Only use Client Secret on backend
- ✅ Rotate secrets if compromised

### 2. Validate Tokens on Backend
- ✅ Always verify Google tokens on the server
- ✅ Never trust tokens from client alone
- ✅ Check email_verified field

### 3. Use HTTPS in Production
- ⚠️ Current setup uses HTTP
- ✅ Recommended: Set up HTTPS with Let's Encrypt
- ✅ Update authorized origins to use https://

### 4. Limit Scopes
- ✅ Only request necessary scopes (email, profile)
- ❌ Don't request more permissions than needed

---

## Production Checklist

Before going live with Google OAuth:

- [ ] OAuth consent screen fully configured
- [ ] App verified by Google (if needed for production)
- [ ] Production domains added to authorized origins
- [ ] Production redirect URIs added
- [ ] Environment variables set on Azure
- [ ] HTTPS enabled (recommended)
- [ ] Test with multiple Google accounts
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] Test error handling (denied permissions, etc.)

---

## Advanced Configuration

### Enable One-Tap Sign-In
Already enabled in Login.jsx:
```jsx
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  useOneTap  // ← This enables One-Tap
  theme="outline"
  size="large"
/>
```

### Customize Button Appearance
```jsx
<GoogleLogin
  theme="filled_blue"  // or "outline", "filled_black"
  size="large"         // or "medium", "small"
  text="signin_with"   // or "signup_with", "continue_with"
  shape="rectangular"  // or "pill", "circle"
  width="300"
/>
```

### Handle Account Linking
The backend already handles this:
- New user → Create account
- Existing email/password user → Link Google account
- Existing Google user → Sign in

---

## API Reference

### Backend Endpoint

**POST** `/api/auth/google`

**Request**:
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6I..."
}
```

**Success Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "John Doe",
    "avatarUrl": "https://..."
  },
  "token": "jwt_token_here"
}
```

**Error Responses**:
- 400: Missing credential or email not verified
- 401: Invalid or expired token
- 500: Server error

---

## Additional Resources

- **Google OAuth 2.0 Docs**: https://developers.google.com/identity/protocols/oauth2
- **Google Sign-In for Web**: https://developers.google.com/identity/gsi/web
- **React Google OAuth Library**: https://www.npmjs.com/package/@react-oauth/google
- **google-auth-library**: https://www.npmjs.com/package/google-auth-library

---

## Support

If Google OAuth still isn't working after following this guide:

1. **Check Backend Logs**:
   ```bash
   docker-compose logs -f app | grep -i "google\|oauth"
   ```

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Verify Environment Variables**:
   ```bash
   # Backend
   echo $GOOGLE_CLIENT_ID

   # Frontend (in browser console)
   console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
   ```

4. **Test API Directly**:
   ```bash
   curl -X POST http://4.157.253.229:3000/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{"credential": "test_token"}'
   ```

---

## Summary

✅ **Google OAuth is now configured!**

**What works**:
- Sign in with Google button on Login page
- Sign up with Google button on Register page
- One-Tap sign-in (automatic popup)
- Token verification on backend
- Automatic user creation
- Account linking for existing users
- Profile information (name, email, avatar)

**Next steps**:
1. Get your Google Cloud credentials
2. Add them to environment variables
3. Restart the application
4. Test the sign-in flow

---

**Setup completed by Claude Code** 🤖
