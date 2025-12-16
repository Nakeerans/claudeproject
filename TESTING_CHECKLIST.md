# JobFlow Extension - Testing Checklist

## Pre-Testing Setup

- [ ] Extension installed in Chrome (chrome://extensions/)
- [ ] Logged in to http://4.157.253.229:3000
- [ ] Profile created in Settings page

---

## Test 1: Profile Management (Backend + Frontend)

### API Endpoints
- [ ] GET /api/profile - Retrieve profile
- [ ] PUT /api/profile - Create/update profile
- [ ] DELETE /api/profile - Delete profile

### Frontend UI
- [ ] Navigate to Settings page (/settings)
- [ ] Fill in all profile fields:
  - Personal: firstName, lastName, email, phone
  - Links: linkedinUrl, githubUrl, portfolioUrl, websiteUrl
  - Location: address, city, state, zipCode, country
  - Professional: currentTitle, yearsExperience
- [ ] Click "Save Profile" button
- [ ] Verify success message appears
- [ ] Refresh page and verify data persists
- [ ] Update some fields and save again
- [ ] Verify updates are saved

---

## Test 2: Authentication Check (Extension → Backend)

### Setup
- [ ] Extension popup opened
- [ ] On a job application page

### Tests
- [ ] Click purple "Autofill" button while logged in
  - Expected: Autofill proceeds
- [ ] Log out from web app
- [ ] Click purple "Autofill" button while logged out
  - Expected: "Not Authenticated" message
- [ ] Log back in
- [ ] Refresh job page
- [ ] Click autofill button
  - Expected: Works again

---

## Test 3: Simple Autofill (No Pattern)

### Test Sites
Try on these job boards:
1. Greenhouse: https://boards.greenhouse.io/embed/job_app?token=123
2. Lever: https://jobs.lever.co/company/position/apply
3. LinkedIn Easy Apply
4. Indeed application forms

### For Each Site
- [ ] Navigate to application form
- [ ] Verify purple button appears
- [ ] Click "⚡ JobFlow: Autofill" button
- [ ] Verify authentication check passes
- [ ] Verify profile is fetched
- [ ] Count filled fields
- [ ] Verify filled data matches profile:
  - [ ] First Name
  - [ ] Last Name
  - [ ] Email
  - [ ] Phone
  - [ ] LinkedIn URL
  - [ ] GitHub URL
  - [ ] City
  - [ ] Current Title
- [ ] Check for fields that weren't filled
- [ ] Verify success message shows count

---

## Test 4: Learning Mode (Pattern Recording)

### Test on Workday or ADP
These sites have complex forms that benefit from patterns.

- [ ] Open extension popup
- [ ] Click "Start Learning Mode"
- [ ] Verify red banner appears: "🔴 Recording"
- [ ] Fill form manually (all fields)
- [ ] Click extension popup again
- [ ] Click "⏹️ Stop Learning Mode"
- [ ] Verify success message with action count
- [ ] Check console for API call to /api/patterns
- [ ] Verify pattern saved to database

### Verify Pattern in Settings
- [ ] Go to Settings → Saved Patterns tab
- [ ] Find the pattern for the site
- [ ] Verify it shows:
  - Site URL
  - Site Name
  - Recorded date
  - Times Used: 0
  - Success Rate: null (not used yet)

---

## Test 5: Pattern-Based Autofill

### Prerequisites
- [ ] Pattern recorded for a specific site (from Test 4)

### Test
- [ ] Return to the same job board
- [ ] Navigate to a new application on that site
- [ ] Click purple "Autofill" button
- [ ] Verify pattern is used (check console logs)
- [ ] Verify autofill is faster/more accurate
- [ ] Check that more fields are filled compared to simple autofill
- [ ] Verify form submission works

---

## Test 6: Success Tracking

### After Multiple Autofills
- [ ] Perform autofill 5 times on same site
- [ ] Check Settings → Saved Patterns
- [ ] Verify pattern shows:
  - Times Used: 5 (incremented)
  - Success Rate: X% (calculated)
- [ ] Verify success rate changes based on outcomes

### API Verification
- [ ] Check network tab for PUT /api/patterns/:id/stats calls
- [ ] Verify each autofill triggers stats update
- [ ] Verify success=true/false parameter

---

## Test 7: Error Handling

### No Profile
- [ ] Delete profile from Settings
- [ ] Try to autofill
- [ ] Expected: "No Profile Found" message with link to Settings

### No Pattern (First Time on Site)
- [ ] Visit new job board (never recorded pattern)
- [ ] Click autofill
- [ ] Expected: Falls back to field detection
- [ ] Verify still fills basic fields

### Network Error
- [ ] Disconnect internet
- [ ] Try to autofill
- [ ] Expected: Error message
- [ ] Reconnect internet
- [ ] Try again
- [ ] Expected: Works

### Form Not Detected
- [ ] Visit page with no application form
- [ ] Verify no purple button appears
- [ ] Open popup
- [ ] Expected: "No application forms detected"

---

## Test 8: Privacy & Security

### Learning Mode
- [ ] Start learning mode
- [ ] Fill sensitive data (SSN, salary, etc.)
- [ ] Stop learning mode
- [ ] Check saved pattern in database
- [ ] Verify NO actual values are stored
- [ ] Verify only field selectors/types are stored

### Profile Data
- [ ] Check database user_profiles table
- [ ] Verify data is encrypted in transit (HTTPS)
- [ ] Verify authentication required for all endpoints

---

## Test 9: Multi-Page Forms

### LinkedIn Easy Apply (Multi-Step)
- [ ] Start application
- [ ] Click autofill on first page
- [ ] Navigate to next page
- [ ] Click autofill again
- [ ] Verify each page fills correctly
- [ ] Complete application

---

## Test 10: Cross-Browser Compatibility

### Chrome
- [ ] All tests pass in Chrome

### Edge (Chromium)
- [ ] Extension loads
- [ ] Autofill works
- [ ] Learning mode works

### Brave
- [ ] Extension loads
- [ ] Autofill works
- [ ] Learning mode works

---

## Performance Tests

- [ ] Time to autofill (should be < 3 seconds)
- [ ] Learning mode overhead (should not slow down form filling)
- [ ] Pattern retrieval speed (should be instant)
- [ ] Profile fetch speed (should be < 1 second)

---

## Database Verification

### UserProfile Table
```sql
SELECT * FROM user_profiles WHERE user_id = '<your-user-id>';
```
- [ ] Verify all fields saved correctly
- [ ] Verify snake_case columns (first_name, not firstName)
- [ ] Verify timestamps (created_at, updated_at)

### AutofillPattern Table
```sql
SELECT * FROM autofill_patterns WHERE user_id = '<your-user-id>';
```
- [ ] Verify patterns saved
- [ ] Verify actions JSON structure
- [ ] Verify fieldMappings JSON structure
- [ ] Verify timesUsed increments
- [ ] Verify successRate calculation

---

## Console Logs to Check

### Extension Content Script
- [ ] "✓ JobFlow initialized"
- [ ] "JobFlow: Detected X form(s)"
- [ ] "JobFlow: Starting autofill..."
- [ ] "JobFlow: Filled X fields"
- [ ] "JobFlow: Recording started" (learning mode)
- [ ] "JobFlow: Recording stopped, captured X actions"

### Extension Background/Popup
- [ ] API calls show in network tab
- [ ] Authentication checks log success/failure
- [ ] Pattern save/retrieve operations logged

### Backend Logs
- [ ] Profile CRUD operations logged
- [ ] Pattern CRUD operations logged
- [ ] Authentication checks logged
- [ ] No errors in server logs

---

## Regression Tests

Ensure previous functionality still works:
- [ ] User registration
- [ ] User login
- [ ] Dashboard loads
- [ ] Job board navigation
- [ ] All existing features work

---

## Known Limitations (Expected Behavior)

- [ ] File uploads (resume/cover letter) NOT filled - Expected
- [ ] CAPTCHA NOT bypassed - Expected (by design)
- [ ] Some dynamic forms may need Learning Mode - Expected
- [ ] Only Chrome/Chromium supported - Expected

---

## Documentation Verification

- [ ] EXTENSION_GUIDE.md is accurate
- [ ] All steps in guide work as described
- [ ] Screenshots (if added) are current
- [ ] Troubleshooting section covers common issues
- [ ] Links to web app work

---

## Production Readiness

- [ ] All API endpoints working on Azure
- [ ] Extension connects to production URL
- [ ] Database migrations applied
- [ ] No console errors in production
- [ ] HTTPS working (if applicable)
- [ ] CORS configured correctly
- [ ] Rate limiting (if applicable)
- [ ] Error logging working

---

## Final Verification

- [ ] Apply to 3 different jobs using the extension
- [ ] All applications submitted successfully
- [ ] Check application success rate
- [ ] Verify data accuracy in submitted applications
- [ ] No data leaks or privacy issues
- [ ] Extension performance acceptable

---

## Test Results Summary

**Date Tested**: _________________

**Tester**: _________________

**Passed**: _____ / _____

**Failed**: _____ / _____

**Blocking Issues**: _________________

**Notes**:
