# JobFlow Chrome Extension - Installation Guide

Quick guide to install and use the JobFlow Chrome Extension for autofilling job applications.

---

## What is the JobFlow Extension?

The JobFlow Chrome Extension allows you to:
- ✨ **Autofill job applications** with one click
- 💼 **Save job postings** directly from any website
- 🎯 **Smart field detection** - automatically fills the right information
- 🔒 **Secure sync** with your JobFlow account

---

## Installation Steps

### Step 1: Download the Extension

**Option A: Clone the Repository**
```bash
git clone https://github.com/Nakeerans/claudeproject.git
cd claudeproject/job-application-platform/apps/extension
```

**Option B: Download ZIP**
1. Go to: https://github.com/Nakeerans/claudeproject
2. Click **Code** → **Download ZIP**
3. Extract the ZIP file
4. Navigate to: `claudeproject/job-application-platform/apps/extension/`

---

### Step 2: Open Chrome Extensions Page

1. Open Google Chrome
2. Navigate to: `chrome://extensions/`
   - Or click **⋮** (three dots) → **Extensions** → **Manage Extensions**

---

### Step 3: Enable Developer Mode

1. Find the **Developer mode** toggle in the top right corner
2. Click to enable it
3. You should now see additional buttons appear

---

### Step 4: Load the Extension

1. Click **Load unpacked** button (top left)
2. Navigate to the extension folder:
   ```
   claudeproject/job-application-platform/apps/extension/
   ```
3. Select the folder and click **Select Folder**

---

### Step 5: Verify Installation

You should now see:
- ✅ JobFlow extension card in chrome://extensions/
- ✅ Extension icon in your Chrome toolbar
- ✅ Extension is enabled (toggle is blue)

**Pin the extension** (optional but recommended):
1. Click the puzzle piece icon 🧩 in Chrome toolbar
2. Find JobFlow extension
3. Click the pin icon 📌

---

## How to Use the Extension

### Initial Setup

1. **Log in to JobFlow**
   - Visit: https://dusti.pro (or http://4.157.253.229:3000)
   - Sign in with your account

2. **Complete Your Profile**
   - Go to **Settings** page
   - Fill in all your information:
     - Personal details (name, email, phone)
     - Education history
     - Work experience
     - Skills
     - Resume/CV upload

3. **Sync with Extension**
   - Click the extension icon in Chrome toolbar
   - Click "Sync Profile" if needed
   - Your information is now ready to use!

---

### Autofilling Job Applications

1. **Visit a Job Application Page**
   - Go to any job board (LinkedIn, Indeed, Glassdoor, etc.)
   - Open a job application form

2. **Click the Extension Icon**
   - Click the JobFlow extension icon in your Chrome toolbar
   - A popup will appear

3. **Autofill the Form**
   - Click **"Autofill Application"** button
   - Watch the magic happen! ✨
   - All detected fields will be filled automatically

4. **Review and Submit**
   - Review the filled information
   - Make any necessary adjustments
   - Submit your application!

---

### Saving Job Postings

You can save jobs directly from any website:

1. **Visit a Job Posting**
   - Navigate to any job listing page

2. **Click Extension Icon**
   - JobFlow popup appears

3. **Click "Save Job"**
   - Job details are extracted and saved to your JobFlow account
   - Appears in your Board and Dashboard

---

## Extension Features

### Autofill Capabilities

The extension can automatically fill:
- ✅ Name (First, Last, Full)
- ✅ Email address
- ✅ Phone number
- ✅ Address (Street, City, State, ZIP)
- ✅ Education (School, Degree, GPA, Dates)
- ✅ Work Experience (Company, Position, Dates, Description)
- ✅ Skills and Technologies
- ✅ Resume/Cover Letter upload
- ✅ LinkedIn/GitHub/Portfolio URLs
- ✅ Availability and Start Date

### Smart Detection

The extension uses intelligent field detection:
- Recognizes common field names and labels
- Works across different job application platforms
- Handles various form structures
- Supports both standard HTML forms and custom frameworks

---

## Troubleshooting

### Extension Not Appearing After Installation

**Issue**: Extension doesn't show up in Chrome toolbar

**Solutions**:
1. Make sure you selected the correct folder (containing `manifest.json`)
2. Check chrome://extensions/ for any error messages
3. Click the puzzle piece 🧩 icon and look for JobFlow
4. Try reloading the extension:
   - Go to chrome://extensions/
   - Click the reload icon ⟳ on the JobFlow card

---

### Autofill Not Working

**Issue**: Clicking "Autofill" doesn't fill the form

**Solutions**:

1. **Check if you're logged in**
   - Open the extension popup
   - Make sure you see your profile information
   - If not, click "Login" and sign in

2. **Complete your profile**
   - Go to JobFlow → Settings
   - Fill in all required fields
   - Save your profile

3. **Refresh the page**
   - Reload the job application page
   - Try autofill again

4. **Check browser console**
   - Press F12 to open DevTools
   - Look for any error messages
   - Report issues if you see errors

---

### Fields Not Filled Correctly

**Issue**: Some fields are filled with wrong information

**Solutions**:
1. **Update your profile** - Make sure all information in Settings is correct
2. **Review field mappings** - Some custom forms may need manual adjustment
3. **Manual override** - You can always manually edit fields after autofill

---

### Extension Icon Not Clickable

**Issue**: Extension icon is grayed out or doesn't respond

**Solutions**:
1. Make sure you're on a webpage (not chrome:// page)
2. Refresh the page
3. Try disabling and re-enabling the extension
4. Check if Chrome needs an update

---

### Sync Issues

**Issue**: Profile changes don't sync to extension

**Solutions**:
1. Click "Sync Profile" in the extension popup
2. Log out and log back in
3. Reload the extension from chrome://extensions/
4. Clear browser cache and try again

---

## Privacy & Security

### What Data Does the Extension Access?

- ✅ Only job application forms on pages you visit
- ✅ Your JobFlow profile data (when you're logged in)
- ❌ Does NOT access passwords or payment information
- ❌ Does NOT track your browsing history
- ❌ Does NOT collect personal data beyond what you provide

### Data Storage

- Your profile data is stored securely in your JobFlow account
- Extension only caches necessary data locally
- All communication is encrypted (HTTPS)
- You can delete your data anytime from Settings

### Permissions

The extension requires these permissions:
- **activeTab**: To interact with the current page
- **storage**: To cache your profile locally
- **identity** (optional): For seamless login

---

## Frequently Asked Questions

### Do I need to be logged in to use autofill?

Yes, you need to be logged in to your JobFlow account for the extension to access your profile information.

### Does the extension work on all websites?

The extension works on most standard job application forms. Some heavily customized forms may require manual adjustment after autofill.

### Can I use the extension on multiple computers?

Yes! Your profile syncs across devices as long as you're logged in to the same JobFlow account.

### Does the extension cost money?

No, the JobFlow extension is completely free to use!

### Will the extension slow down my browser?

No, the extension only runs when you click the icon and is designed to be lightweight.

### Can I customize what information gets filled?

Yes, you can update your profile in Settings to control what information is available for autofill.

---

## Support & Feedback

### Need Help?

1. **Check the Web App**: Visit https://dusti.pro/extension for the latest guide
2. **View Documentation**: See [EXTENSION_GUIDE.md](./EXTENSION_GUIDE.md) for technical details
3. **Report Issues**: Open an issue on [GitHub](https://github.com/Nakeerans/claudeproject/issues)

### Feature Requests

Have an idea to improve the extension? We'd love to hear it!
- Open a feature request on GitHub
- Describe your use case and how it would help

---

## Quick Reference

### Installation Commands

```bash
# Clone repository
git clone https://github.com/Nakeerans/claudeproject.git

# Navigate to extension folder
cd claudeproject/job-application-platform/apps/extension
```

### Chrome URLs

- Extensions Page: `chrome://extensions/`
- Extension Shortcut: Click puzzle piece 🧩 in toolbar

### Important Files

- Extension folder: `job-application-platform/apps/extension/`
- Manifest: `manifest.json`
- Main script: `popup.js`
- Content script: `content.js`

---

## Updates

The extension is actively maintained. To update:

1. Pull latest changes from GitHub:
   ```bash
   cd claudeproject
   git pull origin main
   ```

2. Reload extension:
   - Go to chrome://extensions/
   - Click reload icon ⟳ on JobFlow card

---

## Version History

### Current Version: 1.0.0
- ✅ One-click autofill for job applications
- ✅ Smart field detection
- ✅ Job posting extraction and saving
- ✅ Profile sync with JobFlow account
- ✅ Secure authentication

---

**Happy Job Hunting!** 🎯

Visit https://dusti.pro to get started with JobFlow today!

---

**Created by JobFlow Team**
**Last Updated**: December 2024
