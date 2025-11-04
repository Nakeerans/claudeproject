# Chrome Extension Learning Guide

This guide will help you understand the source code of two Chrome extensions:
1. **Huntr** - Job Search Tracker & Autofill
2. **Email Extractor** - Extract emails from web pages

Both extensions are copied to `./extensions/` for your learning and practice.

---

## Extension Structure Overview

### What is a Chrome Extension?

A Chrome extension is a small software program that customizes the browsing experience. They are built using web technologies:
- **HTML** - Structure
- **CSS** - Styling
- **JavaScript** - Functionality

---

## Key Files Explained

### 1. **manifest.json** - The Extension Configuration File

This is the **most important file** in any Chrome extension. It tells Chrome:
- What permissions the extension needs
- What scripts to run
- Where and when to run them
- Icons, name, version, etc.

#### Key Fields in manifest.json:

```json
{
  "manifest_version": 3,  // Use Manifest V3 (latest)
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "What the extension does",

  // Icon shown in browser toolbar
  "action": {
    "default_icon": "icon.png",
    "default_popup": "popup.html"  // Popup when clicking icon
  },

  // Background script (runs in the background)
  "background": {
    "service_worker": "background.js"
  },

  // Scripts injected into web pages
  "content_scripts": [{
    "matches": ["https://*/*"],  // Which pages to run on
    "js": ["content.js"],         // JavaScript files
    "css": ["styles.css"]         // CSS files
  }],

  // Permissions needed
  "permissions": ["storage", "tabs"],

  // Host permissions (which websites can access)
  "host_permissions": ["https://*/*"]
}
```

---

## Huntr Extension Analysis

**Location:** `./extensions/huntr-extension/`

### Architecture Overview:

```
huntr-extension/
├── manifest.json          # Extension configuration
├── background.bundle.js   # Service worker (background tasks)
├── content.bundle.js      # Injected into web pages
├── autofill.bundle.js     # Autofill functionality
├── jobParser.bundle.js    # Parse job postings
├── assets/                # Icons, CSS, images
└── libs/                  # Third-party libraries (jQuery)
```

### Key Components:

#### 1. **Background Service Worker** (`background.bundle.js`)
- **Purpose:** Runs in the background, manages extension state
- **What it does:**
  - Listens for browser events (tab changes, navigation)
  - Communicates with Huntr.co servers
  - Manages data storage
  - Handles alarms/timers

**Permissions Used:**
```json
"permissions": [
  "alarms",           // Schedule tasks
  "storage",          // Store data locally
  "tabs",             // Access tab information
  "webNavigation",    // Track page navigation
  "scripting",        // Inject scripts dynamically
  "unlimitedStorage"  // Store large amounts of data
]
```

#### 2. **Content Script** (`content.bundle.js`)
- **Purpose:** Injected into every webpage you visit
- **What it does:**
  - Detects job postings on career websites
  - Adds "Save to Huntr" buttons to job pages
  - Autofills application forms
  - Scrapes job details (title, company, salary)

**Injection Configuration:**
```json
"content_scripts": [{
  "css": ["assets/simple-line-icons.css", "assets/animate.css"],
  "js": ["libs/jquery-3.2.1.min.js", "libs/jquery-ui.js", "content.bundle.js"],
  "matches": ["http://*/*", "https://*/*"]  // Runs on ALL websites
}]
```

#### 3. **Autofill Script** (`autofill.bundle.js`)
- **Purpose:** Automatically fill job application forms
- **How it works:**
  - Reads your profile data from storage
  - Identifies form fields (name, email, phone, etc.)
  - Fills them with your saved information
  - Handles file uploads (resume, cover letter)

#### 4. **Job Parser** (`jobParser.bundle.js`)
- **Purpose:** Extract job information from web pages
- **How it works:**
  - Uses CSS selectors to find job details
  - Parses text to extract salary, location, etc.
  - Normalizes data format
  - Sends to Huntr.co servers

### Communication Flow:

```
Web Page → Content Script → Background Worker → Huntr.co API
    ↓           ↓                    ↓
  DOM      Message Passing      Chrome Storage
```

---

## Email Extractor Extension Analysis

**Location:** `./extensions/email-extractor/`

### Architecture Overview:

```
email-extractor/
├── manifest.json       # Extension configuration
├── bgv3.js            # Background service worker
├── content.js         # Main content script
├── popup.html         # Popup UI when clicking icon
├── popupv3.js         # Popup logic
├── mc.js              # Gmail-specific script
├── scripts/
│   ├── jquery.min.js
│   ├── utils.js
│   └── linkedin.js    # LinkedIn-specific extraction
└── images/            # Icons
```

### Key Components:

#### 1. **Popup Interface** (`popup.html` + `popupv3.js`)
- **Purpose:** UI shown when clicking extension icon
- **Features:**
  - Display extracted emails
  - Copy to clipboard
  - Export options (CSV, TXT)
  - Settings/configuration

#### 2. **Content Script** (`content.js`)
- **Purpose:** Extract emails from current page
- **How it works:**
  - Scans page HTML for email patterns
  - Uses regex: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
  - Filters out invalid emails
  - Stores results in Chrome storage

#### 3. **Site-Specific Scripts:**

**Gmail Script** (`mc.js`):
```json
{
  "js": ["mc.js"],
  "matches": ["*://mail.google.com/*"],
  "run_at": "document_end"
}
```
- Extracts emails from Gmail interface
- Handles Gmail's dynamic loading

**LinkedIn Script** (`scripts/linkedin.js`):
```json
{
  "js": ["scripts/linkedin.js"],
  "matches": ["*://*.linkedin.com/*"],
  "run_at": "document_end"
}
```
- Extracts emails from LinkedIn profiles
- Respects LinkedIn's structure

#### 4. **Background Worker** (`bgv3.js`)
- **Purpose:** Coordinate extraction across tabs
- **Features:**
  - Listen for messages from content scripts
  - Aggregate emails from multiple pages
  - Handle keyboard shortcuts (Ctrl+Shift+1)
  - Manage storage

### Keyboard Shortcut:

```json
"commands": {
  "copy-emails-to-clipboard": {
    "suggested_key": {
      "default": "Ctrl+Shift+1",
      "mac": "Command+Shift+1"
    }
  }
}
```

---

## Core Concepts to Learn

### 1. **Content Scripts vs Background Scripts**

| Content Scripts | Background Scripts |
|----------------|-------------------|
| Run in webpage context | Run in extension context |
| Can access DOM | Cannot access DOM |
| Isolated from page JS | Manages extension state |
| Limited permissions | Full extension permissions |

### 2. **Message Passing**

Extensions use message passing for communication:

**Content Script sends message:**
```javascript
chrome.runtime.sendMessage({
  action: "saveEmail",
  email: "user@example.com"
});
```

**Background script receives:**
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveEmail") {
    // Save to storage
    chrome.storage.local.set({ email: message.email });
  }
});
```

### 3. **Chrome Storage API**

```javascript
// Save data
chrome.storage.local.set({ key: "value" }, () => {
  console.log("Saved!");
});

// Retrieve data
chrome.storage.local.get(["key"], (result) => {
  console.log("Value:", result.key);
});

// Listen for changes
chrome.storage.onChanged.addListener((changes, area) => {
  console.log("Storage changed:", changes);
});
```

### 4. **Permissions Explained**

| Permission | What it allows |
|-----------|----------------|
| `storage` | Save data locally |
| `tabs` | Access tab info (URL, title) |
| `webNavigation` | Track page navigation |
| `scripting` | Inject scripts dynamically |
| `alarms` | Schedule tasks |
| `cookies` | Access cookies |

### 5. **Host Permissions**

```json
"host_permissions": [
  "https://huntr.co/*",      // Specific domain
  "https://*/*",             // All HTTPS sites
  "http://*/*",              // All HTTP sites
  "<all_urls>"               // All URLs
]
```

---

## Learning Path

### Step 1: Start with Email Extractor (Simpler)

1. **Read `manifest.json`** - Understand structure
2. **Open `popup.html`** - See the UI
3. **Read `content.js`** - See how emails are extracted
4. **Read `bgv3.js`** - See background logic
5. **Test modifications** - Try extracting phone numbers!

### Step 2: Study Huntr Extension (Advanced)

1. **Analyze `manifest.json`** - Note complex permissions
2. **Study content script injection** - How it runs on all pages
3. **Understand autofill logic** - Form field detection
4. **Learn job parsing** - CSS selectors and data extraction
5. **Study API communication** - How it talks to Huntr.co

---

## Practical Exercises

### Exercise 1: Simple Email Extractor
Create your own simplified version:
- Extract emails from current page
- Show count in popup
- Copy all to clipboard

### Exercise 2: Link Collector
Build an extension that:
- Collects all links from a page
- Filters by domain
- Exports to CSV

### Exercise 3: Form Autofill
Build a basic autofill extension:
- Save user profile data
- Detect form fields
- Fill with saved data

### Exercise 4: Job Saver Button
Create an extension that:
- Adds a "Save" button to job postings
- Extracts job title, company, URL
- Stores in local storage
- Shows saved jobs in popup

---

## Tools for Development

### 1. **Load Extension Locally**

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select extension directory

### 2. **Debug Extension**

- **Content Scripts:** Regular DevTools (F12)
- **Background Worker:** Click "service worker" link in `chrome://extensions/`
- **Popup:** Right-click popup → "Inspect"

### 3. **Test Changes**

1. Make code changes
2. Go to `chrome://extensions/`
3. Click "Reload" button for your extension
4. Test on webpage

---

## Code Snippets to Study

### 1. Detect if on specific website:

```javascript
// In content script
if (window.location.hostname.includes('linkedin.com')) {
  console.log("We're on LinkedIn!");
  // LinkedIn-specific logic
}
```

### 2. Extract text using CSS selectors:

```javascript
// Get job title
const jobTitle = document.querySelector('.job-title')?.textContent;

// Get all emails
const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
const pageText = document.body.innerText;
const emails = pageText.match(emailRegex);
```

### 3. Add button to page:

```javascript
// Create button
const button = document.createElement('button');
button.textContent = 'Save Job';
button.style.cssText = 'position: fixed; top: 10px; right: 10px;';

// Add click handler
button.addEventListener('click', () => {
  alert('Job saved!');
});

// Add to page
document.body.appendChild(button);
```

### 4. Send message to background:

```javascript
// Content script
chrome.runtime.sendMessage({
  type: 'SAVE_JOB',
  data: {
    title: 'Software Engineer',
    company: 'Google'
  }
}, (response) => {
  console.log('Response:', response);
});

// Background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SAVE_JOB') {
    // Save to storage
    chrome.storage.local.set({ job: msg.data });
    sendResponse({ success: true });
  }
});
```

---

## Resources

### Official Documentation:
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome APIs](https://developer.chrome.com/docs/extensions/reference/)

### Tutorials:
- [Getting Started Guide](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)

---

## Next Steps

1. **Read through both manifests completely**
2. **Study the content scripts** - See how they interact with pages
3. **Try modifying Email Extractor** - Change the regex, add features
4. **Build your own extension** - Start simple, add features gradually
5. **Explore other extensions** - Use the finder script to copy more

---

## File Locations

- **Huntr Extension:** `~/Devops_practise/claudeproject/chrome-extension-analyzer/extensions/huntr-extension/`
- **Email Extractor:** `~/Devops_practise/claudeproject/chrome-extension-analyzer/extensions/email-extractor/`
- **Extension Finder Script:** `~/Devops_practise/claudeproject/chrome-extension-analyzer/find-extensions.sh`

---

## Tips for Learning

1. **Start Small** - Don't try to understand everything at once
2. **Use Console Logs** - Add `console.log()` everywhere to see what's happening
3. **Break Things** - Modify code and see what breaks
4. **Read Line by Line** - Don't skip over code you don't understand
5. **Build Your Own** - Best way to learn is by doing

Happy Learning! 🚀
