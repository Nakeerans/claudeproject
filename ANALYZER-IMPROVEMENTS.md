# AI-Guided Analyzer Improvements

## Problem Identified
The analyzer didn't explore main application features after completing the setup wizard because:

1. **Hard-coded setup wizard instructions** in the prompt that Claude kept following even after reaching the main app
2. **Setup wizard status never changed** - it stayed "in_progress" even on welcome-guide page
3. **Only 10 iterations** - spent 6 on setup, only 4 on main app exploration
4. **Not adaptive** - assumes every login goes through setup wizard

## Your Key Insight
> "remember while logging in not it wont face the setup pages that doesn't mean we should remove test for those pages we should just use test based on what page it is"

This is absolutely correct! The analyzer should be **adaptive** and detect what page it's on, then act accordingly.

## Required Changes

### 1. Make Max Iterations Adaptive
**File**: `scripts/ai-guided-huntr-analyzer.js`
**Line**: 41

```javascript
// BEFORE
maxIterations: 10,

// AFTER
maxIterations: 25, // Increased for deeper feature exploration
```

### 2. Create Adaptive Prompt Function
**File**: `scripts/ai-guided-huntr-analyzer.js`
**Add new function before `askClaudeForGuidance`** (around line 396)

```javascript
/**
 * BUILD ADAPTIVE PROMPT based on current page type
 */
function buildAdaptivePrompt(pageState) {
  const isSetupPage = pageState.pageData.isSetupPage;
  const hasStartFromScratch = pageState.pageData.setupElements.scratchOptions.length > 0;
  const url = pageState.pageData.url;

  // Detect page type
  let pageType = 'unknown';
  let specificInstructions = '';

  if (isSetupPage && hasStartFromScratch) {
    pageType = 'setup_wizard';
    specificInstructions = `
**SETUP WIZARD DETECTED:**
This is a setup/onboarding page. Your goal is to complete it quickly:
- If you see "Start from Scratch" option → select it
- Fill only REQUIRED fields (marked with * or causing Continue/Finish button to be disabled)
- Click Continue/Next/Finish to proceed
- After completing setup, the app will redirect to main features
`;
  } else if (url.includes('/track') || url.includes('/board') || url.includes('/dashboard')) {
    pageType = 'main_application';
    specificInstructions = `
**MAIN APPLICATION DETECTED:**
Setup is complete! Now explore job tracking features:
- Click on navigation links to discover different sections
- Interact with job boards, lists, and cards
- Try creating/adding items (jobs, contacts, notes)
- Explore settings, profiles, and user features
- Test search, filters, and sorting options
- IMPORTANT: Explore DEEPLY - click on items, open modals, test all buttons
`;
  } else if (url.includes('/settings') || url.includes('/profile')) {
    pageType = 'settings';
    specificInstructions = `
**SETTINGS/PROFILE PAGE:**
Explore user configuration options:
- Review all available settings
- Test toggles, dropdowns, and input fields (but DON'T save unless necessary)
- Document what can be configured
- Check profile information fields
`;
  } else if (url.includes('/resumes') || url.includes('/resume-builder')) {
    pageType = 'resume_features';
    specificInstructions = `
**RESUME BUILDER/MANAGER:**
Explore resume-related features:
- Check resume templates and builders
- Test AI review features
- Document how users can upload/create resumes
- Explore import/export options
`;
  } else {
    pageType = 'general_exploration';
    specificInstructions = `
**GENERAL PAGE:**
Analyze this page and identify its purpose:
- What is the main feature/function of this page?
- What actions can users take?
- Are there navigation links to other sections?
- Explore ALL visible elements systematically
`;
  }

  return { pageType, specificInstructions };
}
```

### 3. Update `askClaudeForGuidance` Function
**File**: `scripts/ai-guided-huntr-analyzer.js`
**Lines**: 399-507

Replace the hard-coded prompt with adaptive one:

```javascript
async function askClaudeForGuidance(pageState, context) {
  console.log('\n🧠 Asking Claude AI for guidance (analyzing HTML)...');

  // BUILD ADAPTIVE PROMPT based on page type
  const { pageType, specificInstructions } = buildAdaptivePrompt(pageState);

  console.log(`📍 Page Type Detected: ${pageType}`);

  // Build comprehensive prompt with HTML structure
  const prompt = `You are an intelligent web application analyzer exploring Huntr.co, a job application tracking platform.

**CURRENT PAGE TYPE: ${pageType.toUpperCase()}**

${specificInstructions}

**Current Context:**
- Page URL: ${pageState.pageData.url}
- Page Title: ${pageState.pageData.title}
- Page Type: ${pageType}
- Current Goal: ${aiState.currentGoal}
- Iteration: ${aiState.iteration}/${config.maxIterations}
- Explored Pages: ${aiState.exploredPages.length}
- Features Discovered: ${aiState.discoveredFeatures.length}

**PAGE STRUCTURE ANALYSIS:**

**Inputs (${pageState.pageData.inputs.length}):**
${pageState.pageData.inputs.slice(0, 10).map((inp, i) =>
  `${i + 1}. Type: ${inp.type}, Name: ${inp.name}, Placeholder: "${inp.placeholder}", ID: ${inp.id}, Visible: ${inp.visible}, Disabled: ${inp.disabled}, Selector: ${inp.cssSelector}`
).join('\n')}

**Buttons (${pageState.pageData.buttons.length}):**
${pageState.pageData.buttons.slice(0, 15).map((btn, i) =>
  `${i + 1}. Text: "${btn.text}", Disabled: ${btn.disabled}, Visible: ${btn.visible}, Selector: ${btn.cssSelector}`
).join('\n')}

**Links/Navigation (${pageState.pageData.links.length}):**
${pageState.pageData.links.slice(0, 15).map((link, i) =>
  `${i + 1}. Text: "${link.text}", Href: ${link.href}, Visible: ${link.visible}`
).join('\n')}

**Headings:**
${pageState.pageData.headings.slice(0, 10).map(h => `- ${h.tag}: "${h.text}"`).join('\n')}

**Previously Explored:**
${aiState.exploredPages.slice(-5).map(p => `- ${p.name} (${p.type})`).join('\n')}

**Your Task:**
Analyze this ${pageType} page and decide the BEST next actions for thorough exploration.

**PRIORITY RULES:**
1. **NEVER repeat the same action twice** - check "Previously Explored" list
2. **Prioritize unexplored navigation links** - discover new sections
3. **Click on interactive elements** - buttons, cards, list items, modals
4. **Fill forms only when necessary** - to unlock features or complete workflows
5. **Be thorough** - explore all visible UI elements systematically

Respond in JSON format:
{
  "analysis": "Detailed analysis - what is this page for? What can users do here?",
  "nextActions": [
    {
      "type": "click|fill_form|navigate|wait",
      "target": "CSS selector from element data above",
      "elementText": "Visible text of element",
      "reason": "Why this action discovers new features",
      "priority": 1-10
    }
  ],
  "discoveredFeatures": ["All features/UI components found on this page"],
  "newGoal": "What to explore next",
  "estimatedCoverage": 0-100
}`;

  // ... rest of function remains the same
}
```

### 4. Update Initial Goal
**File**: `scripts/ai-guided-huntr-analyzer.js`
**Line**: 86

```javascript
// BEFORE
currentGoal: 'Bypass setup wizard and discover all main application features',

// AFTER
currentGoal: 'Explore and document all Huntr.co features systematically',
```

### 5. Remove Setup Wizard Status Tracking
**File**: `scripts/ai-guided-huntr-analyzer.js`
**Lines**: 88, 530-534

DELETE these lines (no longer needed with adaptive approach):
```javascript
// Line 88 - DELETE
setupWizardCompleted: false,

// Lines 530-534 - DELETE
if (guidance.setupWizardStatus === 'completed') {
  aiState.setupWizardCompleted = true;
  console.log('\n✅ Setup wizard completed! Now exploring main application...');
}
```

## Benefits of These Changes

1. ✅ **Adaptive** - Works whether account has setup wizard or not
2. ✅ **Intelligent** - Gives context-specific instructions based on page type
3. ✅ **Thorough** - 25 iterations allows deep exploration of main features
4. ✅ **Avoids Repetition** - Checks previously explored actions
5. ✅ **Feature-Focused** - Prioritizes discovering new features over setup

## Testing Strategy

After applying changes, test with:

1. **Fresh Account** (with setup wizard):
   - Should complete setup quickly (2-4 iterations)
   - Then explore main features (remaining 21 iterations)

2. **Existing Account** (no setup wizard):
   - Should immediately detect main app
   - Explore features from iteration 1
   - Full 25 iterations on feature discovery

## Next Steps

1. Apply changes to `ai-guided-huntr-analyzer.js`
2. Test with current (already setup) account
3. Verify it explores features deeply
4. Review AI-SUMMARY.md after run to see feature coverage

Would you like me to apply these changes now?
