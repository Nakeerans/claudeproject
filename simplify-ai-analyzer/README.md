# Simplify.jobs AI-Guided Analyzer

Intelligent exploration tool for the Simplify.jobs job application platform using AI guidance and Playwright automation.

## Overview

This tool uses GPT-4 to intelligently navigate and discover features on Simplify.jobs, similar to the Huntr analyzer but optimized for Simplify's platform.

## Features

- 🤖 **AI-Guided Navigation** - GPT-4 decides what to explore next
- 📸 **Automatic Capture** - Screenshots and HTML snapshots of each page
- 🔍 **Smart Element Detection** - Identifies interactive elements intelligently
- 🎯 **Feature Discovery** - Automatically catalogs platform features
- 📊 **Comprehensive Reporting** - Detailed analysis and summary

## Quick Start

### 1. Install Dependencies

```bash
cd simplify-ai-analyzer
npm install
```

### 2. Setup Credentials (Required)

The analyzer uses the same `.credentials` file as the Huntr analyzer.

Create or update the `.credentials` file in the parent directory:

```
# Required for AI analysis
ANTHROPIC_API_KEY=sk-ant-api03-...

# Required for Simplify.jobs login (auto-login)
SIMPLIFY_EMAIL=your-email@example.com
SIMPLIFY_PASSWORD=your-password

# If you also use the Huntr analyzer
HUNTR_EMAIL=your-huntr-email@example.com
HUNTR_PASSWORD=your-huntr-password
```

**Auto-Login**: If `SIMPLIFY_EMAIL` and `SIMPLIFY_PASSWORD` are provided, the tool will automatically log you in.
**Manual Login**: If login credentials are not provided, you'll have 60 seconds to log in manually when the browser opens.

### 3. Run the Analyzer

```bash
npm start
```

The tool will:
1. Open a browser window
2. Navigate to Simplify.jobs login
3. Automatically log you in (if credentials provided) OR wait 60 seconds for manual login
4. Start AI-guided exploration
5. Save all discoveries to `simplify-analysis/`

## Configuration

Edit `ai-guided-simplify-analyzer.js` to customize:

```javascript
const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  BASE_URL: 'https://simplify.jobs',
  LOGIN_URL: 'https://simplify.jobs/auth/login',
  HEADLESS: false,              // Run with visible browser
  MAX_ITERATIONS: 20,            // Maximum exploration steps
  MAX_DEPTH: 3,                  // Maximum click depth
  SMART_FILTERING: true,         // Enable intelligent element filtering
  TIMEOUT: 60000                 // 60 second timeout
};
```

## Output Structure

```
simplify-analysis/
├── screenshots/              # Full-page screenshots
│   └── <timestamp>-<page-name>.png
├── html/                     # HTML snapshots
│   └── <timestamp>-<page-name>.html
├── elements/                 # Extracted interactive elements
│   └── iter<N>-<timestamp>.json
├── feature-inventory.json    # Discovered features
├── visited-pages.json        # All visited URLs
├── ai-decisions.json         # AI decision history
├── execution-errors.json     # Any errors encountered
└── FINAL_SUMMARY.json       # Complete analysis summary
```

## How It Works

### 1. Page Analysis
- Loads page
- Extracts all interactive elements (buttons, links, forms)
- Filters for Simplify-specific features

### 2. AI Decision
- Sends element list to GPT-4
- AI chooses next element to interact with
- Prioritizes unexplored features

### 3. Action Execution
- Clicks/navigates to selected element
- Captures new page state
- Repeats until complete exploration

### 4. Feature Discovery
Automatically detects:
- Dashboard views
- Job boards and listings
- Application trackers
- Resume builders
- Profile management
- Company database
- Autofill features
- AI Copilot tools
- Settings and preferences

## Priority Areas Explored

The AI is configured to prioritize:

1. **Core Features**
   - Dashboard
   - Jobs/Job Board
   - Applications Tracker
   - Resume Builder

2. **Advanced Features**
   - AI Copilot
   - Quick Apply
   - Autofill
   - Company Tracking

3. **Configuration**
   - Settings
   - Profile
   - Preferences

4. **Tools**
   - Search/Filters
   - Saved Jobs
   - Application Status

## Comparison with Huntr Analyzer

| Feature | Huntr Analyzer | Simplify Analyzer |
|---------|----------------|-------------------|
| Platform | huntr.co | simplify.jobs |
| AI Model | GPT-4 | GPT-4 |
| Smart Filtering | ✅ | ✅ Enhanced |
| Manual Login | ✅ | ✅ |
| Feature Detection | Pattern-based | URL + Element-based |
| Max Iterations | 10 | 20 |
| Priority Focus | Job tracking | Quick apply + AI features |

## Key Improvements

1. **Enhanced Element Detection**
   - Better handling of modern React/Vue components
   - Role-based selectors
   - Dynamic content support

2. **Smarter Filtering**
   - Prioritizes Simplify-specific features
   - Avoids duplicate navigation
   - Focuses on unique functionality

3. **Feature Inventory**
   - Real-time feature cataloging
   - Automatic categorization
   - Duplicate detection

4. **Error Handling**
   - Graceful failure recovery
   - Detailed error logging
   - Automatic retries

## Expected Discoveries

The analyzer should find:

### Navigation & Layout
- Main dashboard
- Sidebar navigation
- Top navigation bar
- User menu

### Job Features
- Job search/browse
- Job cards
- Job details
- Quick apply buttons
- Application forms
- Autofill functionality

### Application Tracking
- Application status tracker
- Application history
- Interview scheduling
- Status updates

### Resume Management
- Resume builder
- Multiple resume support
- AI-powered resume optimization
- Resume templates

### AI Features
- AI Copilot
- Job matching
- Application optimization
- Cover letter generation

### Profile & Settings
- User profile
- Account settings
- Preferences
- Integrations

### Company Database
- Company profiles
- Company tracking
- Company insights

## Troubleshooting

### Login Issues

If manual login doesn't work:
1. Ensure you're on the login page
2. Complete any 2FA if required
3. Wait for dashboard to load
4. The tool will detect successful login automatically

### No Elements Found

If the tool reports "No relevant elements found":
- Check if SMART_FILTERING is too aggressive
- Increase MAX_ITERATIONS
- Review priority patterns in code

### AI Decision Errors

If AI decisions fail:
- Verify OPENAI_API_KEY is set correctly
- Check API rate limits
- Review ai-decisions.json for patterns

### Element Click Failures

If clicks aren't working:
- Elements might be in iframes
- Check for modals/overlays
- Increase wait times

## Cost Estimation

Based on GPT-4 API pricing:
- ~500 tokens per AI decision
- ~20 iterations = 10,000 tokens
- Cost: ~$0.30 per full run

## Tips for Best Results

1. **Let it run completely** - Don't interrupt the exploration
2. **Review screenshots** - Visual confirmation of discoveries
3. **Check feature inventory** - See what was found
4. **Examine AI decisions** - Understand the exploration strategy
5. **Run multiple times** - Different paths may discover different features

## Advanced Usage

### Custom Priority Patterns

Edit the `filterRelevantElements` function to prioritize specific features:

```javascript
const priorityPatterns = [
  'your-custom-feature',
  'special-button',
  // ...
];
```

### Increase Exploration Depth

```javascript
const CONFIG = {
  MAX_ITERATIONS: 30,  // More steps
  MAX_DEPTH: 5,        // Deeper navigation
};
```

### Export Analysis

```bash
# After running, generate report
node generate-report.js
```

## Next Steps

After running the analyzer:

1. **Review Results**
   - Check `FINAL_SUMMARY.json`
   - Browse screenshots
   - Read feature inventory

2. **Compare with Huntr**
   - Use insights from both platforms
   - Identify unique features
   - Understand different approaches

3. **Build Extensions**
   - Use discovered features
   - Design better autofill
   - Optimize user flows

## Contributing

To improve the analyzer:

1. Enhance element detection
2. Add new feature patterns
3. Improve AI prompts
4. Optimize filtering logic

## Support

For issues:
1. Check `execution-errors.json`
2. Review AI decision history
3. Examine browser console logs
4. Adjust configuration

---

**Happy Exploring!** 🚀

This tool helps you understand Simplify.jobs at a deep level for learning and integration purposes.
