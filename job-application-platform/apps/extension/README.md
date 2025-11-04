# JobFlow Chrome Extension

Intelligent job application autofill extension with AI-powered learning capabilities.

## Features

✅ **Form Detection**: Automatically detects job application forms on any website
✅ **Smart Field Analysis**: Identifies field types (name, email, phone, resume, etc.)
✅ **Autofill Button**: Shows a convenient button when forms are detected
✅ **Learning Mode**: Records your manual actions to learn how to autofill
✅ **Beautiful UI**: Modern popup interface with status indicators

## Installation

### Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select this directory: `apps/extension`
5. The extension should now appear in your extensions list

## Testing

### Test on Real Job Sites

Visit any of these sites to test form detection:

- **Lever**: https://jobs.lever.co/
- **Greenhouse**: https://boards.greenhouse.io/
- **Workday**: https://*.myworkdayjobs.com/
- **LinkedIn**: https://www.linkedin.com/jobs/
- **Indeed**: https://www.indeed.com/

### What to Look For

1. **Form Detection**: Look for the purple "⚡ JobFlow: Autofill" button appearing in the top-right
2. **Popup**: Click the extension icon to see the popup interface
3. **Form Count**: The popup should show how many forms were detected
4. **Console Logs**: Open DevTools console to see detected fields

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - Main content script (form detection, recording)
- `popup.html` - Extension popup UI
- `popup.js` - Popup functionality
- `README.md` - This file

## Features Implemented

### ✅ Phase 1 (Current)

- [x] Form detection with heuristics
- [x] Field type identification
- [x] Autofill button UI
- [x] Popup interface
- [x] Recording mode (basic)
- [x] Console logging for debugging

### 🚧 Phase 2 (Next)

- [ ] Connect to web app API
- [ ] Fetch user profile data
- [ ] Actual autofill functionality
- [ ] Store recorded sessions
- [ ] Background service worker

### 🔮 Phase 3 (Future)

- [ ] AI pattern recognition
- [ ] Automation script generation
- [ ] Stuck detection & fallback
- [ ] Multi-page form support
- [ ] File upload handling

## How It Works

### Form Detection

The extension uses heuristics to detect job application forms:

```javascript
// Looks for forms with:
- Email field
- File upload (for resume) OR Name + Phone fields
```

### Field Type Detection

Analyzes field attributes to determine data type:

```javascript
// Checks:
- input.type (email, tel, file)
- input.name (firstName, lastName, phone)
- input.placeholder
- Associated labels
```

### Recording Mode

When activated, records:
- Click events (which elements clicked)
- Input events (which fields filled, but not the actual data for privacy)
- Navigation (page URLs)

### Selector Generation

Creates multiple fallback selectors for robustness:
1. `#id` - Most reliable if available
2. `[data-testid]` - Developer-friendly
3. `[name]` - Common for form fields
4. CSS path - Structural fallback

## Development

### Make Changes

1. Edit `content.js` or other files
2. Go to `chrome://extensions/`
3. Click the reload icon on the JobFlow extension
4. Refresh the job site page you're testing on

### Debug

Open DevTools Console (F12) to see:
- Form detection logs
- Field analysis results
- Recorded actions (when in learning mode)

### Add Features

See `../jobflow-project/SYSTEM_ARCHITECTURE.md` for:
- Complete autofill engine code
- Background service worker implementation
- Pattern analyzer
- AI integration

## Known Limitations

- Currently detects forms but doesn't autofill yet (needs web app integration)
- Recording mode captures events but doesn't send to backend yet
- No icons (manifest references icon files that don't exist yet)
- No background service worker (for persistent state)

## Next Steps

1. **Test the extension** on various job sites
2. **Set up web app** to provide profile data API
3. **Implement autofill** using profile data
4. **Connect recording** to backend for AI analysis

## Troubleshooting

**Extension not loading?**
- Check manifest.json syntax
- Look for errors in chrome://extensions/
- Make sure all referenced files exist

**Form not detected?**
- Open DevTools console
- Look for "JobFlow extension loaded" message
- Check if form meets detection heuristics

**Button not appearing?**
- Refresh the page after loading extension
- Check if page uses Shadow DOM (not supported yet)
- Look for console errors

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

---

Built with ❤️ for JobFlow
