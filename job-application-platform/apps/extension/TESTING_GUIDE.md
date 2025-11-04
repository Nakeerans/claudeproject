# JobFlow Extension - Testing Guide

## Quick Test Checklist

Follow these steps to verify the extension is working:

### 1. Load Extension in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Navigate to and select this directory:
   ```
   /Users/nakeeransaravanan/Devops_practise/claudeproject/job-application-platform/apps/extension
   ```
6. The extension should appear with name: **"JobFlow - Intelligent Application Assistant"**
7. Note: You'll see a warning about missing icons - this is expected and won't affect functionality

### 2. Test Form Detection

Visit these actual job sites to test detection:

#### Option 1: Lever ATS
```
https://jobs.lever.co/
```
- Browse any company's job postings
- Click "Apply" on any position
- Look for the purple **"⚡ JobFlow: Autofill"** button in the top-right corner

#### Option 2: Greenhouse ATS
```
https://boards.greenhouse.io/
```
- Search for companies using Greenhouse
- Apply to any position
- Check for the autofill button

#### Option 3: Workday ATS
```
https://www.google.com/search?q=workday+careers
```
- Find any company using Workday (e.g., Netflix, Amazon)
- Start an application
- Look for detection

#### Option 4: Indeed
```
https://www.indeed.com/
```
- Search for jobs
- Click "Apply Now" on any job
- Test detection on Indeed's application form

### 3. Test Extension Popup

1. Click the extension icon in Chrome toolbar
2. You should see:
   - ✅ Extension Active status
   - Form detection status (if on a job site)
   - "Autofill Current Page" button
   - "Start Learning Mode" button

### 4. Test Autofill Button

1. Visit a job site with an application form
2. Wait for the purple **"⚡ JobFlow: Autofill"** button to appear
3. Click the button
4. You should see an alert showing:
   - Number of fields detected
   - List of identified field types (firstName, email, etc.)
   - Next steps message

### 5. Test Learning Mode (Recording)

1. Visit a job application page
2. Click the extension icon → Click **"Start Learning Mode"**
3. Red banner should appear: **"🔴 Recording - Complete the application manually"**
4. Fill out the form manually:
   - Type in text fields
   - Click buttons
   - Select dropdowns
5. Click extension icon → Click **"⏹️ Stop Learning Mode"**
6. You should see an alert with the number of actions captured

### 6. Check Console Logs

1. On any job site, open DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Look for these messages:
   ```
   🚀 JobFlow extension loaded
   📝 Job application form detected!
   Found X job application form(s)
   ```
4. When in recording mode, you'll see:
   ```
   🔴 Recording started
   Recorded click: {type: 'click', selector: '...', ...}
   Recorded input: {type: 'input', selector: '...', ...}
   ⏹️ Recording stopped
   ```

---

## Expected Behavior

### ✅ What Should Work

1. **Form Detection**:
   - Detects forms with email + (file upload OR name + phone)
   - Shows autofill button in top-right corner
   - Button has hover effect (scales up)

2. **Popup**:
   - Shows "Extension Active" status
   - Shows form count when on job sites
   - Shows helpful message when not on valid page
   - Buttons are clickable and responsive

3. **Recording Mode**:
   - Red banner appears when recording
   - Captures clicks and inputs (but not values for privacy)
   - Generates robust selectors for elements
   - Shows action count when stopped

4. **Field Detection**:
   - Identifies field types: firstName, lastName, email, phone, linkedin, github, website, location, resume, coverLetter
   - Shows detected fields in console
   - Groups fields by form

### ⚠️ Known Limitations (Expected)

1. **No Icons**: Extension works but shows placeholder icon
2. **No Autofill Yet**: Button shows demo message, doesn't actually fill forms (needs web app)
3. **Recording Storage**: Actions are captured but not sent to backend yet
4. **Shadow DOM**: May not detect forms inside Shadow DOM
5. **iFrames**: Won't detect forms inside iframes

---

## Detailed Testing Scenarios

### Scenario 1: Test on Lever (Most Common ATS)

1. Visit `https://jobs.lever.co/` or search for "lever careers" on Google
2. Find any company (e.g., "DocuSign careers")
3. Click "Apply" on any job
4. **Expected Results**:
   - Purple autofill button appears in top-right within 1-2 seconds
   - Extension popup shows "Found 1 application form(s)"
   - Console shows field detection logs
   - Click button shows field breakdown

### Scenario 2: Test Recording on Simple Form

1. Visit `https://jobs.lever.co/` and apply to any job
2. Start Learning Mode from extension popup
3. Manually fill out the form:
   - Enter first name
   - Enter last name
   - Enter email
   - Upload resume (or click the upload button)
   - Click "Submit"
4. Stop Learning Mode
5. **Expected Results**:
   - Alert shows 5+ actions captured
   - Console shows detailed action logs with selectors
   - Actions include both 'input' and 'click' types

### Scenario 3: Test on Multiple Pages (SPA Navigation)

1. Visit LinkedIn jobs or Indeed
2. Browse multiple job listings (forms load dynamically)
3. Extension should re-detect forms on each new job page
4. **Expected Results**:
   - Form count updates in popup
   - Button appears/disappears as you navigate
   - No performance issues or lag

### Scenario 4: Test on Non-Job Page

1. Visit `https://www.google.com/`
2. Open extension popup
3. **Expected Results**:
   - Popup shows "ℹ️ No application forms detected"
   - No autofill button appears on page
   - Extension doesn't interfere with page

---

## Troubleshooting

### Issue: Extension Not Loading

**Symptoms**: Extension doesn't appear in chrome://extensions/

**Solutions**:
1. Check `manifest.json` exists and is valid JSON
2. Make sure you selected the correct directory (`apps/extension`)
3. Look for error messages in chrome://extensions/
4. Try reloading Chrome

### Issue: Button Not Appearing

**Symptoms**: On job site but no purple button

**Solutions**:
1. Open Console (F12) - look for "JobFlow extension loaded" message
2. If message doesn't appear, reload the extension in chrome://extensions/
3. Refresh the job site page
4. Check if the form meets detection criteria (email + file/name+phone)
5. Try a different job site (Lever is most reliable)

### Issue: Form Count Shows 0

**Symptoms**: Extension popup says "No application forms detected"

**Solutions**:
1. Make sure you're on an actual application page (not just job listing)
2. Some sites show forms after clicking "Apply" - click the apply button first
3. Check console for "Job application form detected!" message
4. Form might be inside iframe (not supported yet)

### Issue: Recording Doesn't Capture Actions

**Symptoms**: Stop recording shows 0 actions

**Solutions**:
1. Make sure red banner appeared when you clicked "Start"
2. Check console for "🔴 Recording started" message
3. Try clicking and typing in form fields again
4. Don't click JobFlow UI elements (they're excluded)

### Issue: Console Shows Errors

**Symptoms**: Red errors in console

**Common Errors**:
- "Cannot read property X of undefined" - Usually harmless, extension still works
- "Extension context invalidated" - Reload extension in chrome://extensions/
- "chrome.runtime.sendMessage" error - Refresh page after loading extension

---

## Advanced Testing

### Test Field Type Detection

1. Open Console on a job application page
2. Look for field detection logs
3. Verify these field types are correctly identified:
   - ✅ email
   - ✅ firstName / lastName / fullName
   - ✅ phone
   - ✅ linkedin / github / website
   - ✅ location
   - ✅ resume (file upload)
   - ✅ coverLetter

### Test Selector Robustness

1. Start recording mode
2. Click various elements (buttons, links, inputs)
3. Check console for generated selectors
4. Verify selectors use this priority:
   1. `#id` (if element has ID)
   2. `[data-testid]` (if present)
   3. `[name]` (for form fields)
   4. CSS path with nth-child

### Test on Different ATS Providers

- [x] Lever (https://jobs.lever.co/)
- [ ] Greenhouse (https://boards.greenhouse.io/)
- [ ] Workday (search company + "workday careers")
- [ ] iCIMS (search "icims careers")
- [ ] Taleo (Oracle's ATS)
- [ ] BambooHR
- [ ] SmartRecruiters

---

## Success Criteria

✅ Extension can be loaded without errors
✅ Form detection works on at least 2 different job sites
✅ Autofill button appears and is clickable
✅ Extension popup shows correct status and form counts
✅ Recording mode captures clicks and inputs
✅ Console shows detailed logs for debugging
✅ No performance issues or page crashes
✅ Extension doesn't interfere with normal page usage

---

## Next Steps After Testing

Once you've verified the extension works:

1. **Document Issues**: Note any bugs or unexpected behavior
2. **Test on Real Applications**: Try on companies you're actually interested in
3. **Set up Web App**: Follow `NEXT_STEPS.md` to create the Next.js app
4. **Connect to API**: Implement actual autofill using profile data
5. **Store Recordings**: Send captured actions to backend for AI analysis

---

## Quick Reference

| Action | Expected Result |
|--------|----------------|
| Load extension | Appears in chrome://extensions/ |
| Visit job site | "JobFlow extension loaded" in console |
| Application form | Purple button in top-right |
| Click autofill button | Alert showing detected fields |
| Start recording | Red banner appears |
| Fill form manually | Actions logged in console |
| Stop recording | Alert showing action count |
| Open popup | Status + form count displayed |

---

## Report Template

Use this template to report your testing results:

```
## Testing Results - [Date]

### Environment
- Chrome Version:
- macOS Version:
- Extension Version: 1.0.0

### Test Sites
1. [Site Name] - ✅/❌
   - Form detected: Yes/No
   - Button appeared: Yes/No
   - Fields identified: [list]
   - Issues: [if any]

2. [Site Name] - ✅/❌
   - ...

### Recording Test
- Actions captured: [number]
- Selector quality: Good/Poor
- Issues: [if any]

### Overall Assessment
- Works as expected: Yes/No
- Ready for next phase: Yes/No
- Blockers: [if any]
```

---

**Need Help?**
- Check console for detailed logs
- Verify manifest.json is valid
- Try reloading extension
- Test on Lever first (most reliable)
