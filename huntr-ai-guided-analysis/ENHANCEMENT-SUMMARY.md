# AI-Guided Huntr Analyzer - Enhancement Summary

**Date**: 2025-10-17
**File**: `scripts/ai-guided-huntr-analyzer.js`
**Status**: ✅ Complete

## Overview

The AI-guided Huntr.co analyzer has been significantly enhanced to transition from screenshot-based analysis to HTML/code-based analysis, with comprehensive element tracking and precise selector generation for the future cloning project.

## Major Enhancements

### 1. Analysis Method Change: Screenshots → HTML + DOM

**Previous Approach:**
- Captured screenshots of pages
- Sent images to Claude AI for visual analysis
- Limited element detection accuracy

**New Approach:**
- Captures complete HTML content of each page
- Extracts comprehensive DOM structure with all element types
- Generates precise CSS selectors and XPath for every element
- Sends structured data to Claude AI for code-based analysis

**Benefits:**
- More accurate element identification
- Precise selectors for automation
- Better understanding of page structure
- Complete data for cloning project

### 2. Setup Wizard Navigation Enhancement

**Critical Requirement Implemented:**
After login, the setup wizard has 3 pages:
1. **Page 1**: Job title and experience level → Fill and continue
2. **Page 2**: Import professional info with 3 options:
   - Upload resume file
   - LinkedIn profile URL
   - **Start from Scratch** ← **Always chooses this option**
3. **Page 3**: Continue with setup

**Implementation:**
- Added special `setupElements` detection in `capturePageState()`
- Detects "Start from Scratch", upload, and LinkedIn options
- Claude AI receives explicit instructions to choose scratch option
- Added `setupWizardCompleted` tracking in state
- Enhanced form filling to detect and click scratch options via multiple methods:
  - Radio buttons
  - Checkboxes
  - Clickable cards/buttons
  - Toggle switches

### 3. Comprehensive Element Data Storage

**New Data Structures:**

#### Elements Database (`elements-database.json`)
Stores complete element data for every page:
- All input types (text, checkbox, radio, date, etc.)
- Buttons and clickable elements
- Links and navigation items
- Forms with field relationships
- Labels and headings
- Tabs, modals, dropdowns
- **For each element captures:**
  - Tag name, classes, ID, name
  - Text content and innerHTML
  - All attributes (placeholder, aria-label, data-*, etc.)
  - CSS selector (generated)
  - XPath (generated)
  - Visibility and disabled states
  - Position and dimensions
  - Checked state for checkboxes/radios

#### Pages Database (`pages-database.json`)
Stores complete page structures:
- Timestamp and page name
- Paths to HTML and element files
- Complete page metadata
- URL and pathname
- Page type detection (setup, main app, etc.)

### 4. New Action Type: `click_selector`

**Purpose:** Allow Claude AI to specify precise CSS selectors for clicking

**Implementation:**
```javascript
case 'click_selector':
  // Uses precise CSS selector from Claude
  const element = await page.$(action.target);
  if (element) {
    const isVisible = await element.isVisible();
    const isEnabled = await element.isEnabled();
    if (isVisible && isEnabled) {
      await element.click();
      return true;
    }
  }
  break;
```

**Benefits:**
- More reliable element targeting
- Handles dynamic class names
- Works with data-testid and unique IDs
- Better error reporting

### 5. Enhanced Claude AI Prompt

**New Prompt Structure:**

```
**CRITICAL SETUP WIZARD INSTRUCTIONS:**
[Explicit 3-page setup instructions]

**Current Context:**
- Page URL, title, setup status
- Iteration progress
- Features discovered count

**PAGE STRUCTURE ANALYSIS:**
- Inputs (with type, name, placeholder, selector)
- Checkboxes (with text, checked state, selector)
- Buttons (with text, disabled state, selector)
- Links, Forms, Headings
- **SPECIAL SETUP ELEMENTS DETECTED:**
  - "Start from Scratch" options with selectors
  - Upload options
  - LinkedIn options

**HTML Snippet:**
[First 2000 chars of HTML]

**PRIORITY RULES:**
1. If setup page with scratch option → MUST click it
2. If Continue disabled → interact with required fields first
3. Use precise selectors
4. Consider visibility/disabled states
5. Explore new pages before repeating
```

**Response Format:**
```json
{
  "analysis": "Detailed page analysis",
  "nextActions": [
    {
      "type": "click|fill_form|navigate|click_selector|wait",
      "target": "Precise CSS selector",
      "elementText": "Visible element text",
      "reason": "Why this action is critical",
      "priority": 1-10
    }
  ],
  "discoveredFeatures": ["Feature list with technical details"],
  "newGoal": "Updated exploration goal",
  "estimatedCoverage": 0-100,
  "setupWizardStatus": "in_progress|completed|not_started"
}
```

## New File Structure

```
huntr-ai-guided-analysis/
├── html/                          # NEW - HTML snapshots
│   └── [timestamp]-[pagename].html
├── elements/                      # NEW - Element JSON files
│   └── [timestamp]-[pagename].json
├── screenshots/                   # Existing - Screenshots
│   └── [timestamp]-[pagename].png
├── reports/                       # Enhanced reports
│   ├── AI-GUIDED-REPORT.json     # Enhanced with database stats
│   └── AI-SUMMARY.md             # Enhanced with database info
├── ai-decisions.json              # Existing - AI decision log
├── elements-database.json         # NEW - Complete elements DB
└── pages-database.json            # NEW - Complete pages DB
```

## Code Changes Summary

### Configuration (Lines 27-34)
```javascript
const HTML_DIR = path.join(ANALYSIS_DIR, 'html');
const ELEMENTS_DIR = path.join(ANALYSIS_DIR, 'elements');
const ELEMENTS_DATABASE = path.join(ANALYSIS_DIR, 'elements-database.json');
const PAGES_DATABASE = path.join(ANALYSIS_DIR, 'pages-database.json');
```

### AI State (Lines 51-66)
```javascript
const aiState = {
  // ... existing fields
  htmlPages: [],                  // NEW
  elementsDatabase: {},           // NEW
  pagesDatabase: {},              // NEW
  componentLibrary: [],           // NEW
  apiEndpoints: [],               // NEW
  setupWizardCompleted: false     // NEW
};
```

### capturePageState() Function (Lines 93-271)
- **Completely rewritten** to capture HTML and comprehensive DOM data
- Generates CSS selectors and XPath for all elements
- Detects setup wizard special elements
- Saves HTML files and element JSON files
- Stores everything in databases

### askClaudeForGuidance() Function (Lines 276-392)
- Removed screenshot capture and image sending
- Builds comprehensive HTML + element structure prompt
- Includes setup wizard instructions
- Sends structured element data instead of images
- Tracks setup wizard status from Claude's response

### executeAction() Function (Lines 465-638)
- Added new `click_selector` action type (Lines 515-538)
- Enhanced form filling with scratch option detection (Lines 127-197)
- Better error handling and logging with element text

### Database Saving (Lines 850-865)
```javascript
// Save elements database
await fs.writeFile(
  ELEMENTS_DATABASE,
  JSON.stringify(aiState.elementsDatabase, null, 2)
);

// Save pages database
await fs.writeFile(
  PAGES_DATABASE,
  JSON.stringify(aiState.pagesDatabase, null, 2)
);
```

### Enhanced Reporting (Lines 867-972)
- Added database statistics to final report
- Enhanced markdown report with database sections
- Improved console output with comprehensive summary

## Usage for Cloning Project

### 1. Elements Database
Use `elements-database.json` to:
- Identify all UI components and their properties
- Get exact CSS selectors for recreation
- Understand element states and behaviors
- Map out form structures and validation

### 2. Pages Database
Use `pages-database.json` to:
- Understand full application flow
- See page-to-page relationships
- Identify navigation patterns
- Map out multi-step processes (like setup wizard)

### 3. HTML Files
Use HTML snapshots to:
- Analyze actual markup structure
- Identify CSS framework/libraries used
- See inline styles and scripts
- Understand component nesting

## Testing the Enhancements

Run the analyzer with:
```bash
./scripts/run-ai-analysis.sh
```

Or directly:
```bash
export ANTHROPIC_API_KEY="your-key"
export HUNTR_EMAIL="your-email"
export HUNTR_PASSWORD="your-password"
node scripts/ai-guided-huntr-analyzer.js
```

## Expected Outcomes

1. ✅ Successful login
2. ✅ Setup wizard navigation (choosing "Start from Scratch")
3. ✅ HTML files saved for each page state
4. ✅ Element JSON files saved for each page
5. ✅ Elements database with comprehensive data
6. ✅ Pages database with complete structures
7. ✅ Claude AI analyzes code instead of screenshots
8. ✅ Precise element targeting via CSS selectors
9. ✅ Enhanced reports with database information
10. ✅ Complete data ready for cloning project

## Key Improvements Over Previous Version

| Aspect | Previous | Enhanced |
|--------|----------|----------|
| Analysis Method | Screenshot-based | HTML/code-based |
| Element Detection | Limited visual | Comprehensive DOM |
| Selector Precision | Text-based | CSS + XPath |
| Setup Wizard | Manual bypass | Automated "scratch" selection |
| Data Storage | Screenshots only | HTML + Elements + Pages DBs |
| Cloning Support | Basic features list | Complete rebuild data |
| Claude Integration | Image analysis | Structured code analysis |

## Files Modified

1. **scripts/ai-guided-huntr-analyzer.js** - Main analyzer (complete rewrite of key functions)
2. **.gitignore** - Updated to track new databases while excluding large files

## Backup Created

- `scripts/ai-guided-huntr-analyzer.js.backup-before-html-enhancement` - Safety backup before changes

## Next Steps

1. Run the enhanced analyzer to test all changes
2. Review generated databases for completeness
3. Use element database to start UI component recreation
4. Use pages database to map application architecture
5. Build clone using precise selectors and structures from databases
