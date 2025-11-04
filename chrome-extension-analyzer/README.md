# Chrome Extension Analyzer

This directory contains source code from installed Chrome extensions for learning and analysis purposes.

## Setup Complete! ✅

You now have:
1. **Two Chrome extensions** copied for analysis
2. **Complete learning guide** with explanations
3. **Extension finder script** to find more extensions

---

## Directory Structure

```
chrome-extension-analyzer/
├── README.md                    # This file
├── LEARNING_GUIDE.md           # Comprehensive learning guide
├── find-extensions.sh          # Script to find installed extensions
└── extensions/
    ├── huntr-extension/        # Huntr Job Tracker (Advanced)
    │   ├── manifest.json       # Extension configuration
    │   ├── background.bundle.js    # Service worker
    │   ├── content.bundle.js       # Content script
    │   ├── autofill.bundle.js      # Autofill logic
    │   ├── jobParser.bundle.js     # Job parsing logic
    │   └── assets/                 # Icons, CSS, fonts
    │
    └── email-extractor/        # Email Extractor (Beginner-friendly)
        ├── manifest.json       # Extension configuration
        ├── bgv3.js            # Background worker
        ├── content.js         # Main content script
        ├── popup.html         # Popup UI
        ├── popupv3.js         # Popup logic
        ├── mc.js              # Gmail-specific script
        └── scripts/
            ├── jquery.min.js
            ├── utils.js
            └── linkedin.js    # LinkedIn-specific extraction
```

---

## Quick Start

### 1. Read the Learning Guide

```bash
open LEARNING_GUIDE.md
```

Or view it in any text editor. It contains:
- Complete architecture explanations
- Code examples
- Learning exercises
- Best practices

### 2. Explore Extension Files

**Start with Email Extractor (simpler):**
```bash
cd extensions/email-extractor/
cat manifest.json        # View configuration
cat content.js          # View content script
open popup.html         # View popup UI
```

**Then study Huntr (more advanced):**
```bash
cd extensions/huntr-extension/
cat manifest.json       # View complex configuration
```

### 3. Find More Extensions

Run the finder script to see all installed extensions:
```bash
./find-extensions.sh
```

To copy another extension for analysis:
```bash
cp -r '<extension_path>' ~/Devops_practise/claudeproject/chrome-extension-analyzer/extensions/
```

---

## Extensions Included

### 1. **Huntr - Job Search Tracker & Autofill** (Advanced)

**What it does:**
- Tracks job applications across the web
- Autofills application forms
- Parses job postings
- Syncs with huntr.co

**Learning Topics:**
- Complex content scripts
- Service workers
- Form autofill techniques
- API communication
- Job data extraction
- Storage management

**Key Files:**
- `background.bundle.js` - Background service worker
- `content.bundle.js` - Main content script (runs on all pages)
- `autofill.bundle.js` - Form autofill logic
- `jobParser.bundle.js` - Job posting parser

### 2. **Email Extractor** (Beginner-Friendly)

**What it does:**
- Extracts emails from web pages
- Site-specific extraction (Gmail, LinkedIn)
- Copy to clipboard
- Export to CSV

**Learning Topics:**
- Basic content scripts
- Popup UI
- Regex patterns
- Message passing
- Chrome storage
- Keyboard shortcuts

**Key Files:**
- `content.js` - Email extraction logic
- `popup.html` - UI when clicking icon
- `popupv3.js` - Popup functionality
- `bgv3.js` - Background worker
- `mc.js` - Gmail-specific extraction
- `scripts/linkedin.js` - LinkedIn-specific extraction

---

## Learning Path

### Beginner (Start Here)

1. **Read LEARNING_GUIDE.md** - Sections:
   - "What is a Chrome Extension?"
   - "Key Files Explained"
   - "manifest.json structure"

2. **Study Email Extractor:**
   - Open `manifest.json` - understand configuration
   - Read `content.js` - see how emails are extracted
   - Look at `popup.html` - see the UI
   - Study `bgv3.js` - background worker logic

3. **Try modifying Email Extractor:**
   - Change the email regex
   - Add phone number extraction
   - Modify the popup UI

### Intermediate

1. **Study Huntr Extension:**
   - Analyze `manifest.json` - complex permissions
   - Study content script injection
   - Understand autofill logic

2. **Build your own extension:**
   - Link collector
   - Form autofill
   - Page modifier

### Advanced

1. **Deep dive into Huntr:**
   - Reverse engineer job parsing logic
   - Study API communication patterns
   - Understand form field detection

2. **Build complex extensions:**
   - Job application tracker
   - Data scraper
   - Automation tool

---

## Key Concepts

### Chrome Extension Architecture

```
┌─────────────────────────────────────────┐
│         Browser (Chrome)                │
├─────────────────────────────────────────┤
│  Background Worker (Service Worker)     │
│  - Runs in background                   │
│  - Manages extension state              │
│  - Handles events                       │
└──────────────┬──────────────────────────┘
               │ Message Passing
┌──────────────┴──────────────────────────┐
│  Content Script                         │
│  - Injected into web pages              │
│  - Access to DOM                        │
│  - Limited permissions                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  Web Page (DOM)                         │
│  - Actual website content               │
│  - Isolated from extension              │
└─────────────────────────────────────────┘
```

### Message Passing Flow

```
Content Script  →  chrome.runtime.sendMessage()  →  Background Worker
     ↓                                                      ↓
Popup Script   ←  chrome.runtime.sendMessage()  ←   Background Worker
```

---

## Tools & Resources

### Development Tools

1. **Load unpacked extension:**
   - `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"

2. **Debug:**
   - Content script: F12 on webpage
   - Background: Click "service worker" in extensions page
   - Popup: Right-click popup → Inspect

3. **Reload after changes:**
   - Go to `chrome://extensions/`
   - Click reload button

### Official Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/)
- [API Reference](https://developer.chrome.com/docs/extensions/reference/)
- [Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

---

## Available Extensions to Study

You have these extensions installed (run `./find-extensions.sh` to see all):

**Job Application Related:**
- Jobalytics (Resume Keyword Analyzer)
- Huntr ✅ Already copied
- Simplify Copilot
- Teal (Job Search Companion)
- Lightning Autofill

**Productivity:**
- Email Extractor ✅ Already copied
- Grammarly
- Boomerang for Gmail
- CORS Unblock

**Other:**
- Honey (Price comparison)
- Earth View from Google Earth
- Chrome Remote Desktop

To copy any of these, use the find-extensions.sh script to get the path, then:
```bash
cp -r '<path>' ~/Devops_practise/claudeproject/chrome-extension-analyzer/extensions/<name>
```

---

## Practice Exercises

### Exercise 1: Simple Modifications
- Change Email Extractor regex to find phone numbers
- Modify popup UI colors in Email Extractor
- Add a counter for total emails found

### Exercise 2: Build Simple Extension
Create a "Link Collector" extension:
- Extract all links from current page
- Show count in popup
- Copy all links to clipboard

### Exercise 3: Form Helper
Build a basic form autofill:
- Save name, email, phone in storage
- Add button to fill forms
- Detect common form fields

### Exercise 4: Page Analyzer
Create an extension that:
- Counts images, links, scripts on page
- Shows page statistics in popup
- Highlights specific elements

---

## Tips

1. **Start Simple** - Don't try to understand everything at once
2. **Use Console Logs** - Add logging to see what's happening
3. **Read Manifest First** - Understand permissions and structure
4. **Modify Existing Code** - Learn by changing things
5. **Build Your Own** - Apply what you learned

---

## Questions to Explore

As you study the code, ask yourself:

1. **Email Extractor:**
   - How does the regex find emails?
   - How does it handle different websites?
   - How does the popup communicate with content script?
   - How are keyboard shortcuts implemented?

2. **Huntr:**
   - How does it detect job postings?
   - How does autofill identify form fields?
   - How does it communicate with huntr.co servers?
   - How does it store application data?

---

## Next Steps

1. ✅ Read `LEARNING_GUIDE.md` thoroughly
2. ✅ Study Email Extractor manifest.json
3. ✅ Read Email Extractor content.js
4. ✅ Try modifying Email Extractor
5. ✅ Build your own simple extension
6. ✅ Study Huntr extension
7. ✅ Build a complex extension

---

**Happy Learning! 🚀**

For detailed explanations, examples, and tutorials, see **LEARNING_GUIDE.md**
