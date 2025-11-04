# Enhanced Claude AI Prompts for Deeper Exploration

## Strategy for Reaching 100% Coverage

Based on the 50-iteration test results (75% max coverage, 17 pages discovered), we need to guide Claude AI to:

### 1. Interactive Element Exploration
**Current Gap**: Claude only navigates between pages, doesn't interact with page elements
**Solution**: Add new action types for deeper interaction

```javascript
// NEW ACTION TYPES TO ADD:
{
  "type": "click_card",      // Click into job application cards
  "type": "open_modal",      // Open create/edit modals
  "type": "interact_form",   // Fill and submit forms
  "type": "toggle_view",     // Switch between list/board/card views
  "type": "expand_section",  // Expand collapsible sections
  "type": "click_tab"        // Switch between tabs within a page
}
```

### 2. Enhanced Prompt Instructions

#### For Main Application Pages:
```
**DEEP INTERACTION MODE:**
You've explored the main navigation. Now explore deeper:
- Click into individual job application cards to see detail views
- Open "Create New" or "Add" buttons to discover creation flows
- Test different view modes (List, Board, Calendar if available)
- Expand collapsed sections to see hidden content
- Click on items in lists/tables to see their detail pages
- Interact with dropdown menus and filters
- Open settings panels and configuration dialogs

**PRIORITY HIERARCHY:**
1. Click into cards/list items to see detail pages (HIGH - unexplored content)
2. Open creation modals ("New", "Add", "Create" buttons)
3. Switch view modes (Board/List/Calendar)
4. Expand all collapsible UI sections
5. Only then navigate to new pages
```

#### For Job Board Pages:
```
**BOARD INTERACTION STRATEGY:**
- Click on individual job application cards to open their detail view
- Test drag-and-drop between columns (Wishlist → Applied → Interview)
- Click "Add Job" or "+" buttons to discover job creation flow
- Right-click or click 3-dot menus for additional actions
- Test filtering and sorting options
- Open contact/company links associated with jobs
```

#### For Resume Builder:
```
**RESUME BUILDER DEEP DIVE:**
- Click into each resume to open the editor
- Test all editing tools (formatting, sections, AI suggestions)
- Try template switching
- Test export/download functions
- Explore preview modes (different formats)
- Test AI resume review feature on actual resume
```

#### For Forms and Creation Flows:
```
**FORM INTERACTION STRATEGY:**
- Fill out create/edit forms completely
- Test validation by submitting incomplete forms
- Test all field types (autocomplete, date pickers, dropdowns)
- Try uploading files where supported
- Test "Save Draft" vs "Submit" paths
- Explore multi-step wizards completely
```

### 3. Modified Exploration Algorithm

```javascript
// PHASE 1: Navigate to all pages (Current behavior - DONE)
// PHASE 2: Deep interaction with each page (NEW)
// PHASE 3: Test all creation/edit flows (NEW)
// PHASE 4: Explore all modal dialogs (NEW)
// PHASE 5: Test all interactive widgets (NEW)

const explorationPhases = {
  phase1: "Page Navigation", // 0-30% coverage
  phase2: "Card/List Item Interaction", // 30-60% coverage
  phase3: "Modal & Form Exploration", // 60-80% coverage
  phase4: "View Mode & Filter Testing", // 80-90% coverage
  phase5: "Edge Cases & Hidden Features" // 90-100% coverage
};
```

### 4. Specific Actions for Unexplored Areas

#### Job Application Details:
```json
{
  "type": "click_card",
  "target": ".job-card:first-child, [data-testid*='job'], [class*='JobCard']",
  "reason": "Open first job application to see detail view",
  "priority": 10
}
```

#### Create New Job Flow:
```json
{
  "type": "open_modal",
  "target": "button:has-text('Add Job'), button:has-text('New Application'), [aria-label*='Add']",
  "reason": "Discover job creation workflow",
  "priority": 9
}
```

#### Resume Editing:
```json
{
  "type": "click_card",
  "target": ".resume-card:first-child, [data-testid*='resume']",
  "reason": "Open resume editor to explore editing features",
  "priority": 9
}
```

#### Contact Details:
```json
{
  "type": "click_card",
  "target": ".contact-item:first-child, [class*='ContactCard']",
  "reason": "Open contact detail page",
  "priority": 8
}
```

### 5. Detection Strategy for Missing Features

Add to Claude's prompt:
```
**FEATURE DETECTION:**
Count these elements on the page to estimate unexplored areas:
- Cards/List Items: ${cardCount} → Each card likely has a detail view
- "Create/Add/New" buttons: ${createButtons} → Each button opens a creation flow
- Tabs: ${tabCount} → Each tab has different content
- Dropdown menus: ${dropdownCount} → Each menu has hidden options
- Collapsed sections: ${collapsedCount} → Hidden content to expand

**COVERAGE ESTIMATION:**
- Visited ${visitedCards}/${totalCards} card detail pages
- Opened ${openedModals}/${totalModals} modal dialogs
- Explored ${testedTabs}/${totalTabs} tab sections
- Tested ${testedFilters}/${totalFilters} filter combinations
```

### 6. Updated Priority Rules

```
**NEW PRIORITY RULES:**
1. FIRST RUN (0-30% coverage): Navigate between all main pages
2. SECOND RUN (30-60% coverage): Click into cards/list items on each page
3. THIRD RUN (60-80% coverage): Open all modals and creation flows
4. FOURTH RUN (80-95% coverage): Test view modes, filters, settings
5. FINAL RUN (95-100% coverage): Edge cases and hidden features

**WITHIN EACH PHASE:**
Priority 10: Unexplored detail pages (click cards)
Priority 9: Creation flows (Add/New buttons)
Priority 8: Modal dialogs (Edit/Settings buttons)
Priority 7: View mode switches (Board/List/Calendar)
Priority 6: Expandable sections
Priority 5: Filter/sort options
```

### 7. Example Enhanced Actions List

```json
{
  "nextActions": [
    {
      "type": "click_card",
      "target": "[class*='JobCard']:first-child",
      "elementText": "Software Engineer at Google",
      "reason": "Open first job application detail view to explore job tracking features",
      "priority": 10
    },
    {
      "type": "open_modal",
      "target": "button:has-text('Add Job')",
      "elementText": "Add Job",
      "reason": "Discover job creation workflow and required fields",
      "priority": 9
    },
    {
      "type": "click_tab",
      "target": "[role='tab']:has-text('Interviews')",
      "elementText": "Interviews",
      "reason": "Switch to Interviews tab to see interview tracking features",
      "priority": 8
    },
    {
      "type": "toggle_view",
      "target": "button:has-text('List View')",
      "elementText": "List View",
      "reason": "Switch to list view to see alternative job display mode",
      "priority": 7
    }
  ]
}
```

## Implementation Plan

1. **Update AI prompt** to include phase-based exploration
2. **Add new action handlers** for card clicks, modal opens, tab switches
3. **Enhance coverage calculation** based on interactions, not just pages
4. **Add interaction tracking** to avoid re-clicking same cards
5. **Improve stuck detection** to try clicking cards when on same page
6. **Run new 50-iteration test** with enhanced prompts

## Expected Results

With these enhancements:
- Coverage should reach 85-95% (from current 75%)
- Discover 30-40 unique pages/views (from current 17)
- Capture detailed modal dialogs and creation flows
- Document all interactive features and workflows
