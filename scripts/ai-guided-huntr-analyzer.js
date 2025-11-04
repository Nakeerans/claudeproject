import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AI-GUIDED HUNTR.CO ANALYZER - ENHANCED VERSION
 *
 * This system combines Playwright with Claude AI for intelligent exploration:
 * 1. Playwright captures current page state (HTML + DOM structure)
 * 2. Claude AI analyzes the HTML code and decides what to explore next
 * 3. Playwright executes Claude's instructions with precise selectors
 * 4. Claude documents findings and updates exploration strategy
 * 5. Process repeats until 100% coverage achieved
 *
 * ENHANCEMENTS:
 * - HTML/code analysis instead of screenshots for better accuracy
 * - Proper handling of setup wizard (Start from Scratch option)
 * - Comprehensive element data storage for cloning
 * - All input types and interactions captured
 */

const ANALYSIS_DIR = path.join(__dirname, '../huntr-ai-guided-analysis');
const SCREENSHOTS_DIR = path.join(ANALYSIS_DIR, 'screenshots');
const REPORTS_DIR = path.join(ANALYSIS_DIR, 'reports');
const HTML_DIR = path.join(ANALYSIS_DIR, 'html');
const ELEMENTS_DIR = path.join(ANALYSIS_DIR, 'elements');
const AI_DECISIONS_LOG = path.join(ANALYSIS_DIR, 'ai-decisions.json');
const ELEMENTS_DATABASE = path.join(ANALYSIS_DIR, 'elements-database.json');
const PAGES_DATABASE = path.join(ANALYSIS_DIR, 'pages-database.json');

const config = {
  baseUrl: 'https://huntr.co',
  headless: false,
  slowMo: 100, // Reduced from 500ms to 100ms for faster execution
  timeout: 15000, // Reduced from 30s to 15s
  maxIterations: 50, // Increased from 25 to 50 for deeper feature exploration and higher coverage
  claudeModel: 'claude-3-5-haiku-20241022' // Updated to latest Haiku model
};

// Load credentials from .credentials file
async function loadCredentials() {
  const credentialsPath = path.join(__dirname, '../.credentials');
  try {
    const content = await fs.readFile(credentialsPath, 'utf-8');
    const credentials = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          credentials[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return credentials;
  } catch (error) {
    console.error('❌ Error reading .credentials file:', error.message);
    console.log('\nMake sure .credentials file exists in the project root');
    process.exit(1);
  }
}

// Initialize Claude AI (will be set after loading credentials)
let anthropic;

// Learning state - Enhanced for comprehensive data capture
const aiState = {
  iteration: 0,
  exploredPages: [],
  pendingActions: [],
  discoveredFeatures: [],
  aiDecisions: [],
  screenshots: [],
  htmlPages: [],
  elementsDatabase: {}, // Store all discovered elements by page
  pagesDatabase: {}, // Store complete page structures
  componentLibrary: [], // Reusable UI components found
  apiEndpoints: [], // API calls detected
  currentGoal: 'Explore and document all Huntr.co features systematically',
  explorationCoverage: 0,
  executionErrors: [], // NEW - Store all errors encountered during execution
  actionLog: [], // NEW - Detailed log of all actions and outcomes
  stuckDetectionAttempts: [], // NEW - Track which sections were tried during stuck detection to prevent loops
  clickedCards: new Set(), // NEW for Option 2 - Track which cards have been clicked to avoid duplicates
  openedModals: new Set(), // NEW for Option 2 - Track which modals have been opened
  clickedTabs: new Set() // NEW for Option 2 - Track which tabs have been clicked
};

async function setupDirectories() {
  await fs.mkdir(ANALYSIS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.mkdir(HTML_DIR, { recursive: true });
  await fs.mkdir(ELEMENTS_DIR, { recursive: true });
}

function humanDelay(min = 500, max = 1000) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}

async function detectProtections(page) {
  const hasCaptcha = await page.$('iframe[src*="recaptcha"], iframe[src*="hcaptcha"]');
  if (hasCaptcha) {
    console.log('\n⚠️  CAPTCHA detected! Please solve manually (90s wait)...\n');
    await page.waitForTimeout(90000);
    return true;
  }
  return false;
}

/**
 * DISMISS POPUPS AND MODALS - Close Intercom chat, modals, tooltips, etc.
 * This prevents popups from blocking interaction with page elements.
 */
async function dismissPopupsAndModals(page) {
  try {
    // Method 1: Press Escape key multiple times to dismiss modals
    await page.keyboard.press('Escape').catch(() => {});
    await humanDelay(200, 300);
    await page.keyboard.press('Escape').catch(() => {});
    await humanDelay(200, 300);

    // Method 2: Close modal dialogs with close buttons
    const modalCloseSelectors = [
      '[aria-label="Close"]',
      '[aria-label="close"]',
      'button[aria-label*="close" i]',
      '[data-testid*="close"]',
      '[class*="close"]',
      '[class*="Close"]',
      'button:has-text("Close")',
      'button:has-text("✕")',
      'button:has-text("×")',
      '.modal-close',
      '[role="dialog"] button[aria-label="Close"]',
      'button.Modal__CloseButton',
      '[class*="Modal"] button[class*="close"]'
    ];

    for (const selector of modalCloseSelectors) {
      const closeBtn = await page.$(selector);
      if (closeBtn) {
        const isVisible = await closeBtn.isVisible().catch(() => false);
        if (isVisible) {
          await closeBtn.click().catch(() => {});
          await humanDelay(300, 500);
          await page.keyboard.press('Escape').catch(() => {});
          await humanDelay(200, 300);
          break; // Only close one modal at a time
        }
      }
    }

    // Method 3: Hide modal containers and overlays using JavaScript
    await page.evaluate(() => {
      // Find and hide modal containers
      const modalSelectors = [
        '[class*="Modal__Container"]',
        '[class*="modal"]',
        '[role="dialog"]',
        '[class*="overlay"]',
        '[class*="Overlay"]',
        '[class*="backdrop"]',
        '[class*="Backdrop"]'
      ];

      modalSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex) || 0;
          // Hide high z-index modals/overlays
          if (zIndex > 1000 || selector.includes('Modal') || selector.includes('dialog')) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.zIndex = '-1';
          }
        });
      });

      // Hide Intercom elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const id = el.id || '';
        const className = el.className || '';
        if (id.toLowerCase().includes('intercom') || className.toString().toLowerCase().includes('intercom')) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        }
      });
    });

  } catch (error) {
    // Silently handle errors - popup dismissal is best-effort
  }
}

/**
 * CAPTURE PAGE STATE - HTML + Comprehensive DOM Analysis
 */
async function capturePageState(page, pageName) {
  const timestamp = Date.now();
  const htmlPath = path.join(HTML_DIR, `${timestamp}-${pageName}.html`);
  const elementsPath = path.join(ELEMENTS_DIR, `${timestamp}-${pageName}.json`);

  // Get complete HTML
  const htmlContent = await page.content();
  await fs.writeFile(htmlPath, htmlContent);

  // Get comprehensive page data with ALL element types
  const pageData = await page.evaluate(() => {
    // Helper to get complete element description with selectors
    const describeElement = (el, index) => {
      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);

      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().substring(0, 200),
        innerText: el.innerText?.trim().substring(0, 200),
        innerHTML: el.innerHTML?.substring(0, 500),
        classes: el.className,
        id: el.id,
        name: el.getAttribute('name'),
        type: el.getAttribute('type'),
        value: el.value,
        placeholder: el.getAttribute('placeholder'),
        href: el.getAttribute('href'),
        src: el.getAttribute('src'),
        alt: el.getAttribute('alt'),
        title: el.getAttribute('title'),
        ariaLabel: el.getAttribute('aria-label'),
        role: el.getAttribute('role'),
        dataTestId: el.getAttribute('data-testid'),
        dataId: el.getAttribute('data-id'),
        visible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
        disabled: el.disabled || el.getAttribute('disabled') !== null,
        checked: el.checked,
        position: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        cssSelector: generateSelector(el),
        xpath: generateXPath(el),
        index: index
      };
    };

    // Generate CSS selector for element
    const generateSelector = (el) => {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.trim().split(/\s+/).join('.');
        return `${el.tagName.toLowerCase()}.${classes}`;
      }
      return el.tagName.toLowerCase();
    };

    // Generate XPath for element
    const generateXPath = (el) => {
      if (el.id) return `//*[@id="${el.id}"]`;
      if (el === document.body) return '/html/body';

      let ix = 0;
      const siblings = el.parentNode?.childNodes || [];
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i];
        if (sibling === el) {
          return generateXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + (ix + 1) + ']';
        }
        if (sibling.nodeType === 1 && sibling.tagName === el.tagName) {
          ix++;
        }
      }
    };

    return {
      url: window.location.href,
      title: document.title,
      pathname: window.location.pathname,

      // All interactive elements with complete data
      inputs: Array.from(document.querySelectorAll('input')).map(describeElement),
      textareas: Array.from(document.querySelectorAll('textarea')).map(describeElement),
      selects: Array.from(document.querySelectorAll('select')).map(describeElement),
      buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map(describeElement),
      links: Array.from(document.querySelectorAll('a')).map(describeElement),

      // Special elements
      checkboxes: Array.from(document.querySelectorAll('input[type="checkbox"]')).map(describeElement),
      radios: Array.from(document.querySelectorAll('input[type="radio"]')).map(describeElement),

      // Navigation
      navigation: Array.from(document.querySelectorAll('nav a, aside a, [role="navigation"] a'))
        .filter(a => a.textContent?.trim())
        .map(describeElement),

      // Forms with detailed field info
      forms: Array.from(document.querySelectorAll('form')).map((form, idx) => ({
        id: form.id,
        action: form.action,
        method: form.method,
        name: form.name,
        fields: Array.from(form.querySelectorAll('input, textarea, select')).map(describeElement)
      })),

      // Structure
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(describeElement),

      // UI Components
      tabs: Array.from(document.querySelectorAll('[role="tab"], [class*="tab"]')).map(describeElement),
      modals: Array.from(document.querySelectorAll('[role="dialog"], [class*="modal"]')).map(describeElement),
      dropdowns: Array.from(document.querySelectorAll('[role="listbox"], [class*="dropdown"]')).map(describeElement),

      // Cards and clickable items for deeper exploration (NEW for Option 2)
      cards: Array.from(document.querySelectorAll(
        '[class*="Card"], [class*="card"], [class*="Item"], [class*="item"], ' +
        '[class*="JobCard"], [class*="job-card"], [data-testid*="card"], ' +
        '[role="listitem"], [class*="list-item"]'
      )).filter(el => {
        const rect = el.getBoundingClientRect();
        // Only include visible elements with reasonable size
        return rect.width > 100 && rect.height > 50 &&
               window.getComputedStyle(el).display !== 'none' &&
               window.getComputedStyle(el).visibility !== 'hidden';
      }).map(describeElement),

      // Labels for better understanding
      labels: Array.from(document.querySelectorAll('label')).map(describeElement),

      // Special setup wizard elements
      setupElements: {
        scratchOptions: Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            const parent = el.parentElement?.textContent?.toLowerCase() || '';
            return text.includes('start from scratch') ||
                   text.includes('from scratch') ||
                   parent.includes('start from scratch');
          })
          .map(describeElement),
        uploadOptions: Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('upload') && (text.includes('resume') || text.includes('file'));
          })
          .map(describeElement),
        linkedinOptions: Array.from(document.querySelectorAll('*'))
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('linkedin');
          })
          .map(describeElement)
      },

      // Meta information
      hasModal: !!document.querySelector('[role="dialog"], [class*="modal"]'),
      isSetupPage: window.location.pathname.includes('setup') || window.location.pathname.includes('onboarding'),
      allDataAttributes: Array.from(document.querySelectorAll('[data-testid], [data-id]')).map(el => ({
        testId: el.getAttribute('data-testid'),
        dataId: el.getAttribute('data-id'),
        selector: generateSelector(el)
      }))
    };
  });

  // Store elements in database
  aiState.elementsDatabase[pageData.url] = pageData;
  await fs.writeFile(elementsPath, JSON.stringify(pageData, null, 2));

  // Save to pages database
  aiState.pagesDatabase[pageData.url] = {
    timestamp,
    pageName,
    htmlPath,
    elementsPath,
    data: pageData
  };

  aiState.htmlPages.push({
    timestamp,
    pageName,
    path: htmlPath,
    url: pageData.url
  });

  return {
    htmlPath,
    elementsPath,
    pageData,
    timestamp,
    htmlContent: htmlContent.substring(0, 10000) // First 10k chars for Claude
  };
}

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
This is a setup/onboarding page. Complete it quickly:
- If you see "Start from Scratch" → select it
- Fill ONLY required fields (marked with * or causing buttons to be disabled)
- Click Continue/Next/Finish to proceed
- After completing setup, app will redirect to main features
`;
  } else if (url.includes('/track') || url.includes('/board') || url.includes('/dashboard') || url.includes('/welcome')) {
    pageType = 'main_application';
    specificInstructions = `
**MAIN APPLICATION:**
Setup complete! Use ONLY navigation links to discover pages:
- ONLY click navigation links (<a> tags) to move between pages
- DO NOT click buttons like "Create", "Add", "New", "Edit" - they open modals
- Discover all sections: Application Hub, Resume Builder, Contacts, Companies, Documents, etc.
- Find Settings, Profile, Boards, Metrics pages via navigation
- Your goal: visit every unique page via navigation links
- AVOID: Upgrade/Pricing pages and Chrome extension links
- CRITICAL: Focus on page-to-page navigation, not element interactions
`;
  } else if (url.includes('/settings') || url.includes('/profile')) {
    pageType = 'settings';
    specificInstructions = `
**SETTINGS/PROFILE PAGE:**
Explore configuration options:
- Review all settings available
- Test toggles, dropdowns (don't save unless necessary)
- Document what users can configure
`;
  } else {
    pageType = 'general_exploration';
    specificInstructions = `
**GENERAL PAGE:**
Analyze and identify page purpose:
- What is the main function?
- What actions can users take?
- Explore ALL visible elements
`;
  }

  return { pageType, specificInstructions };
}

/**
 * ASK CLAUDE AI - What should we explore next? (HTML-based analysis)
 */
async function askClaudeForGuidance(pageState, context) {
  console.log('\n🧠 Asking Claude AI for guidance (analyzing HTML)...');

  // BUILD ADAPTIVE PROMPT based on page type
  const { pageType, specificInstructions } = buildAdaptivePrompt(pageState);
  console.log(`📍 Page Type: ${pageType}`);

  // Build comprehensive prompt with HTML structure
  const prompt = `You are an intelligent web application analyzer exploring Huntr.co, a job application tracking platform.

**PAGE TYPE: ${pageType.toUpperCase()}**

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

**Checkboxes (${pageState.pageData.checkboxes.length}):**
${pageState.pageData.checkboxes.map((cb, i) =>
  `${i + 1}. Text: "${cb.text}", Checked: ${cb.checked}, Visible: ${cb.visible}, Disabled: ${inp.disabled}, Selector: ${cb.cssSelector}`
).join('\n')}

**Buttons (${pageState.pageData.buttons.length}):**
${pageState.pageData.buttons.slice(0, 15).map((btn, i) =>
  `${i + 1}. Text: "${btn.text}", Disabled: ${btn.disabled}, Visible: ${btn.visible}, Classes: ${btn.classes}, Selector: ${btn.cssSelector}`
).join('\n')}

**Links (${pageState.pageData.links.length}):**
${pageState.pageData.links.slice(0, 10).map((link, i) =>
  `${i + 1}. Text: "${link.text}", Href: ${link.href}, Visible: ${link.visible}`
).join('\n')}

**Forms (${pageState.pageData.forms.length}):**
${pageState.pageData.forms.map((form, i) =>
  `Form ${i + 1}: ID: ${form.id}, Action: ${form.action}, Fields: ${form.fields.length}`
).join('\n')}

**Headings:**
${pageState.pageData.headings.slice(0, 10).map(h => `- ${h.tag}: "${h.text}"`).join('\n')}

**Cards/List Items (${pageState.pageData.cards.length}) [NEW - for deep exploration]:**
${pageState.pageData.cards.slice(0, 10).map((card, i) =>
  `${i + 1}. Text: "${card.text?.substring(0, 100)}", Classes: ${card.classes}, Visible: ${card.visible}, Selector: ${card.cssSelector}`
).join('\n')}

**SPECIAL SETUP ELEMENTS DETECTED:**
${pageState.pageData.setupElements.scratchOptions.length > 0 ? `
✓ Found "Start from Scratch" options (${pageState.pageData.setupElements.scratchOptions.length}):
${pageState.pageData.setupElements.scratchOptions.map((el, i) =>
  `  ${i + 1}. Text: "${el.text}", Tag: ${el.tag}, Visible: ${el.visible}, Selector: ${el.cssSelector}`
).join('\n')}
` : ''}
${pageState.pageData.setupElements.uploadOptions.length > 0 ? `
- Found upload options (${pageState.pageData.setupElements.uploadOptions.length})
` : ''}
${pageState.pageData.setupElements.linkedinOptions.length > 0 ? `
- Found LinkedIn options (${pageState.pageData.setupElements.linkedinOptions.length})
` : ''}

**Navigation:**
${pageState.pageData.navigation.slice(0, 10).map((nav, i) => `${i + 1}. "${nav.text}" → ${nav.href}`).join('\n')}

**Previously Explored:**
${aiState.exploredPages.map(p => `- ${p.name} (${p.type})`).join('\n')}

**HTML Snippet (First 2000 chars):**
\`\`\`html
${pageState.htmlContent.substring(0, 2000)}
\`\`\`

**Previously Explored:**
${aiState.exploredPages.slice(-5).map(p => `- ${p.name} (${p.type})`).join('\n')}

**EXECUTION FEEDBACK - FAILED ACTIONS (DO NOT RECOMMEND THESE AGAIN):**
${(() => {
  const recentFailures = aiState.actionLog.slice(-10).filter(a => !a.success);
  const failureCounts = {};
  recentFailures.forEach(f => {
    const key = f.target;
    failureCounts[key] = (failureCounts[key] || 0) + 1;
  });
  const uniqueFailures = Object.entries(failureCounts).map(([target, count]) =>
    `- "${target}" (failed ${count} time${count > 1 ? 's' : ''} - link not found or not clickable)`
  );
  return uniqueFailures.length > 0 ? uniqueFailures.join('\n') : '- No recent failures';
})()}

**SUCCESSFULLY VISITED PAGES:**
${aiState.exploredPages.filter(p => p.url).slice(-10).map(p => `- ${p.url}`).join('\n')}

**Your Task:**
Analyze this ${pageType} page and decide the BEST next actions for thorough exploration.
**CRITICAL**: Do NOT recommend links that appear in the "FAILED ACTIONS" list above - they don't work!

**EXPLORATION PHASE:** ${(() => {
  const coverage = aiState.explorationCoverage;
  if (coverage < 30) return 'Phase 1: Page Navigation (0-30%)';
  if (coverage < 60) return 'Phase 2: Card/List Item Interaction (30-60%)';
  if (coverage < 80) return 'Phase 3: Modal & Form Exploration (60-80%)';
  if (coverage < 90) return 'Phase 4: Tab & View Mode Testing (80-90%)';
  return 'Phase 5: Edge Cases & Hidden Features (90-100%)';
})()}

**PRIORITY RULES (Phase-Based):**
${(() => {
  const coverage = aiState.explorationCoverage;
  if (coverage < 30) {
    return `**Current Phase: Page Navigation**
1. Navigate between pages using navigation links (anchor tags with href)
2. Discover all main sections via sidebar/navigation
3. AVOID: Modal buttons (Create, Add, New, Edit), Upgrade/Pricing pages
4. Focus: Visit every unique page/section`;
  }
  if (coverage < 60) {
    return `**Current Phase: Card/List Item Interaction**
1. **HIGH PRIORITY**: Click into cards/list items to see detail views (use "click_card" action)
2. Explore job applications, contacts, documents by clicking on them
3. Continue navigating to unexplored pages
4. AVOID: Modal buttons, Upgrade/Pricing pages
5. Focus: Discover detail pages for all list items`;
  }
  if (coverage < 80) {
    return `**Current Phase: Modal & Form Exploration**
1. **HIGH PRIORITY**: Open modal dialogs (use "open_modal" action for Add/Create/New buttons)
2. Click into remaining cards/list items
3. Explore form creation flows
4. AVOID: Upgrade/Pricing pages
5. Focus: Capture all modal UIs and creation workflows`;
  }
  if (coverage < 90) {
    return `**Current Phase: Tab & View Mode Testing**
1. **HIGH PRIORITY**: Switch between tabs (use "click_tab" action)
2. Test different view modes (Board/List/Calendar)
3. Explore filter and sort options
4. Open remaining modals
5. Focus: Discover all content variations`;
  }
  return `**Current Phase: Edge Cases & Hidden Features**
1. Test edge cases and rare UI states
2. Explore any remaining unexplored elements
3. Document all discovered features thoroughly
4. Focus: Achieve 100% coverage`;
})()}

Respond in JSON format:
{
  "analysis": "Detailed analysis - what is this page for? What can users do here?",
  "nextActions": [
    {
      "type": "navigate" | "click_card" | "open_modal" | "click_tab",
      "target": "CSS selector for element",
      "elementText": "Visible text of element",
      "reason": "Why this action helps discover new features",
      "priority": 1-10
    }
  ],
  "discoveredFeatures": ["All features/UI components found on this page"],
  "newGoal": "What to explore next based on current phase",
  "estimatedCoverage": 0-100
}

**ACTION TYPE USAGE:**
- "navigate": For navigation links (<a> tags) - used in Phase 1
- "click_card": For clicking into cards/list items to see details - used in Phase 2
- "open_modal": For opening creation/edit modal dialogs - used in Phase 3
- "click_tab": For switching between tabs - used in Phase 4

**CRITICAL**: For the "target" field, ALWAYS provide the CSS selector from the element data listings above, NOT plain text!`;

  try {
    const message = await anthropic.messages.create({
      model: config.claudeModel,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const guidance = JSON.parse(jsonStr);

    // Log Claude's decision
    const decision = {
      timestamp: new Date().toISOString(),
      iteration: aiState.iteration,
      page: pageState.pageData.url,
      analysis: guidance.analysis,
      actions: guidance.nextActions,
      features: guidance.discoveredFeatures,
      coverage: guidance.estimatedCoverage
    };

    aiState.aiDecisions.push(decision);
    aiState.currentGoal = guidance.newGoal;
    aiState.explorationCoverage = guidance.estimatedCoverage;

    // Update discovered features
    guidance.discoveredFeatures?.forEach(feature => {
      if (!aiState.discoveredFeatures.includes(feature)) {
        aiState.discoveredFeatures.push(feature);
      }
    });

    console.log(`\n📊 Claude's Analysis:\n${guidance.analysis}\n`);
    console.log(`📈 Estimated Coverage: ${guidance.estimatedCoverage}%`);
    console.log(`🎯 New Goal: ${guidance.newGoal}`);
    console.log(`\n📋 Recommended Actions (${guidance.nextActions?.length || 0}):`);
    guidance.nextActions?.forEach((action, i) => {
      console.log(`  ${i + 1}. [Priority ${action.priority}] ${action.type.toUpperCase()}: "${action.target}"`);
      if (action.elementText) console.log(`     Element Text: "${action.elementText}"`);
      console.log(`     Reason: ${action.reason}`);
    });

    // Save decisions
    await fs.writeFile(AI_DECISIONS_LOG, JSON.stringify(aiState.aiDecisions, null, 2));

    return guidance;

  } catch (error) {
    console.error('❌ Claude AI error:', error.message);
    return {
      analysis: 'Error analyzing page',
      nextActions: [],
      discoveredFeatures: [],
      newGoal: aiState.currentGoal,
      estimatedCoverage: aiState.explorationCoverage
    };
  }
}

/**
 * EXECUTE ACTION - Perform Claude's recommended action
 */
async function executeAction(page, action) {
  console.log(`\n⚡ Executing: ${action.type} → "${action.target}"`);

  const actionLog = {
    timestamp: new Date().toISOString(),
    iteration: aiState.iteration,
    type: action.type,
    target: action.target,
    elementText: action.elementText,
    reason: action.reason,
    success: false,
    error: null,
    details: {}
  };

  try {
    switch (action.type) {
      case 'navigate':
        // Find navigation link - handle both CSS selectors and text
        let navLink = null;

        // Method 1: Try as CSS selector first (if it looks like one)
        if (action.target.includes('[href') || action.target.startsWith('a.') || action.target.startsWith('a#')) {
          console.log(`    → Trying CSS selector: ${action.target}`);
          try {
            navLink = await page.$(action.target);
            if (navLink) {
              const isVisible = await navLink.isVisible().catch(() => false);
              if (!isVisible) {
                console.log(`    → Found but not visible, trying text search...`);
                navLink = null;
              }
            }
          } catch (error) {
            console.log(`    → CSS selector failed: ${error.message}`);
          }
        }

        // Method 2: Try text search if selector failed or not a selector
        if (!navLink) {
          console.log(`    → Trying text search: ${action.target}`);
          navLink = await page.$(`a:has-text("${action.target}")`);
        }

        // Method 3: Try finding by elementText if available
        if (!navLink && action.elementText) {
          console.log(`    → Trying elementText: ${action.elementText}`);
          navLink = await page.$(`a:has-text("${action.elementText}")`);
        }

        if (navLink) {
          const isVisible = await navLink.isVisible().catch(() => false);
          if (isVisible) {
            await navLink.click();
            await page.waitForLoadState('domcontentloaded'); // Changed from networkidle for speed
            await humanDelay(500, 800); // Reduced from 2000-3000ms
            console.log(`  ✓ Navigated successfully`);
            actionLog.success = true;
            actionLog.details.navigatedTo = await page.url();
            actionLog.details.method = action.target.includes('[href') ? 'CSS selector' : 'Text search';
            aiState.actionLog.push(actionLog);
            return true;
          }
        }
        break;

      case 'click':
        // Try as CSS selector first, then fallback to text search
        console.log(`    → Attempting to click: ${action.target}`);

        // Method 1: Try as CSS selector (if it looks like one)
        if (action.target.includes('.') || action.target.includes('#') || action.target.includes('[')) {
          try {
            // Remove :contains() pseudo-selector - not supported by Playwright
            let cleanSelector = action.target.replace(/:contains\(['"]([^'"]+)['"]\)/g, '');
            // Remove [text='...'] attribute selector - use :has-text() instead
            const textMatch = action.target.match(/\[text=['"]([^'"]+)['"]\]/);

            if (textMatch) {
              const text = textMatch[1];
              cleanSelector = cleanSelector.replace(/\[text=['"][^'"]+['"]\]/, '');
              cleanSelector = `${cleanSelector}:has-text("${text}")`;
            }

            const selectorElement = await page.$(cleanSelector);
            if (selectorElement) {
              const isVisible = await selectorElement.isVisible().catch(() => false);
              const isEnabled = await selectorElement.isEnabled().catch(() => true);

              if (isVisible && isEnabled) {
                await selectorElement.click();
                await humanDelay(300, 500); // Reduced from 1000-2000ms
                console.log(`  ✓ Clicked element with selector: ${cleanSelector}`);
                actionLog.success = true;
                actionLog.details.method = 'CSS selector';
                actionLog.details.pageUrl = await page.url();
                aiState.actionLog.push(actionLog);
                return true;
              } else {
                console.log(`  ⚠ Element found but not clickable (visible: ${isVisible}, enabled: ${isEnabled})`);
              }
            }
          } catch (error) {
            console.log(`  → Selector failed, trying text search: ${error.message}`);
          }
        }

        // Method 2: Special handling for Continue/Next/Submit buttons (they often have dynamic class names)
        if (action.elementText && (action.elementText.includes('Continue') || action.elementText.includes('Next') || action.elementText.includes('Submit'))) {
          console.log(`    → Trying generic Continue/Next/Submit button selectors...`);
          const continueSelectors = [
            'button:has-text("Continue")',
            'button:has-text("Next")',
            'button:has-text("Submit")',
            'button[type="submit"]',
            '[role="button"]:has-text("Continue")',
            '[role="button"]:has-text("Next")'
          ];

          for (const selector of continueSelectors) {
            const btn = await page.$(selector);
            if (btn) {
              const isVisible = await btn.isVisible().catch(() => false);
              const isEnabled = await btn.isEnabled().catch(() => false);
              if (isVisible && isEnabled) {
                await btn.click();
                await humanDelay(1000, 2000);
                console.log(`  ✓ Clicked Continue/Next button`);
                actionLog.success = true;
                actionLog.details.method = 'Generic Continue button selector';
                actionLog.details.pageUrl = await page.url();
                aiState.actionLog.push(actionLog);
                return true;
              }
            }
          }
        }

        // Method 3: Find by text (fallback)
        const button = await page.$(`button:has-text("${action.target}"), [role="button"]:has-text("${action.target}"), div:has-text("${action.target}")`);
        if (button) {
          const isVisible = await button.isVisible().catch(() => false);
          if (isVisible) {
            await button.click();
            await humanDelay(1000, 2000);
            console.log(`  ✓ Clicked: ${action.target}`);
            actionLog.success = true;
            actionLog.details.method = 'Text search';
            actionLog.details.pageUrl = await page.url();
            aiState.actionLog.push(actionLog);
            return true;
          }
        }
        break;

      case 'click_card':
        // NEW: Click into card/list item to see detail view
        console.log(`    → Attempting to click card: ${action.target}`);

        // Check if already clicked this card
        const cardKey = `${action.target}-${action.elementText}`;
        if (aiState.clickedCards.has(cardKey)) {
          console.log(`  ⏭️  Already clicked this card, skipping`);
          return false;
        }

        let card = null;

        // Method 1: Try CSS selector
        if (action.target.includes('[') || action.target.includes('.') || action.target.includes('#')) {
          card = await page.$(action.target);
        }

        // Method 2: Try text search
        if (!card) {
          card = await page.$(`[class*="Card"]:has-text("${action.target}"), [class*="card"]:has-text("${action.target}")`);
        }

        // Method 3: Use element text
        if (!card && action.elementText) {
          card = await page.$(`[class*="Card"]:has-text("${action.elementText}"), [role="listitem"]:has-text("${action.elementText}")`);
        }

        if (card) {
          const isVisible = await card.isVisible().catch(() => false);
          if (isVisible) {
            await card.click();
            await page.waitForLoadState('domcontentloaded').catch(() => {});
            await humanDelay(500, 800);
            console.log(`  ✓ Clicked card: ${action.target}`);

            // Track this card as clicked
            aiState.clickedCards.add(cardKey);

            actionLog.success = true;
            actionLog.details.method = 'Card click';
            actionLog.details.pageUrl = await page.url();
            aiState.actionLog.push(actionLog);
            return true;
          }
        }
        break;

      case 'open_modal':
        // NEW: Open modal dialogs (Add, Create, New buttons)
        console.log(`    → Attempting to open modal: ${action.target}`);

        // Check if already opened this modal
        const modalKey = `${action.target}-${action.elementText}`;
        if (aiState.openedModals.has(modalKey)) {
          console.log(`  ⏭️  Already opened this modal, skipping`);
          return false;
        }

        let modalBtn = null;

        // Method 1: Try CSS selector
        if (action.target.includes('[') || action.target.includes('.') || action.target.includes('#')) {
          modalBtn = await page.$(action.target);
        }

        // Method 2: Try common modal button patterns
        if (!modalBtn) {
          const modalSelectors = [
            `button:has-text("${action.target}")`,
            `button:has-text("Add")`,
            `button:has-text("Create")`,
            `button:has-text("New")`,
            `[aria-label*="Add"]`,
            `[aria-label*="Create"]`
          ];

          for (const selector of modalSelectors) {
            modalBtn = await page.$(selector);
            if (modalBtn) {
              const isVisible = await modalBtn.isVisible().catch(() => false);
              if (isVisible) break;
              modalBtn = null;
            }
          }
        }

        if (modalBtn) {
          const isVisible = await modalBtn.isVisible().catch(() => false);
          const isEnabled = await modalBtn.isEnabled().catch(() => true);

          if (isVisible && isEnabled) {
            await modalBtn.click();
            await humanDelay(1000, 1500);

            // Verify modal opened
            const modal = await page.$('[role="dialog"], [class*="Modal"], [class*="modal"]');
            if (modal) {
              console.log(`  ✓ Opened modal: ${action.target}`);

              // Track this modal as opened
              aiState.openedModals.add(modalKey);

              actionLog.success = true;
              actionLog.details.method = 'Modal open';
              actionLog.details.modalFound = true;
              aiState.actionLog.push(actionLog);
              return true;
            } else {
              console.log(`  ⚠ Button clicked but no modal detected`);
            }
          }
        }
        break;

      case 'click_tab':
      case 'switch_tab':
        // NEW/ENHANCED: Click tab to switch content
        console.log(`    → Attempting to click tab: ${action.target}`);

        // Check if already clicked this tab
        const tabKey = `${action.target}-${action.elementText}`;
        if (aiState.clickedTabs.has(tabKey)) {
          console.log(`  ⏭️  Already clicked this tab, skipping`);
          return false;
        }

        let tab = null;

        // Method 1: Try CSS selector
        if (action.target.includes('[') || action.target.includes('.') || action.target.includes('#')) {
          tab = await page.$(action.target);
        }

        // Method 2: Try text search with role
        if (!tab) {
          tab = await page.$(`[role="tab"]:has-text("${action.target}"), [class*="tab"]:has-text("${action.target}")`);
        }

        // Method 3: Use element text
        if (!tab && action.elementText) {
          tab = await page.$(`[role="tab"]:has-text("${action.elementText}")`);
        }

        if (tab) {
          const isVisible = await tab.isVisible().catch(() => false);
          if (isVisible) {
            await tab.click();
            await humanDelay(800, 1200);
            console.log(`  ✓ Switched to tab: ${action.target}`);

            // Track this tab as clicked
            aiState.clickedTabs.add(tabKey);

            actionLog.success = true;
            actionLog.details.method = 'Tab click';
            actionLog.details.pageUrl = await page.url();
            aiState.actionLog.push(actionLog);
            return true;
          }
        }
        break;

      case 'scroll':
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await humanDelay(500, 1000);
        console.log(`  ✓ Scrolled down`);
        return true;

      case 'wait':
        await humanDelay(2000, 3000);
        console.log(`  ✓ Waited for page to settle`);
        return true;

      case 'click_selector':
        // Use precise CSS selector provided by Claude AI
        console.log(`    → Using precise selector: ${action.target}`);
        try {
          const element = await page.$(action.target);
          if (element) {
            const isVisible = await element.isVisible().catch(() => false);
            const isEnabled = await element.isEnabled().catch(() => true);

            if (isVisible && isEnabled) {
              await element.click();
              await humanDelay(1000, 2000);
              console.log(`  ✓ Clicked element with selector: ${action.target}`);
              return true;
            } else {
              console.log(`  ⚠ Element found but not clickable (visible: ${isVisible}, enabled: ${isEnabled})`);
            }
          } else {
            console.log(`  ⚠ Element not found with selector: ${action.target}`);
          }
        } catch (error) {
          console.log(`  ❌ Error with selector: ${error.message}`);
        }
        break;

      case 'fill_form':
        // Comprehensive form filling with support for various input types
        console.log('    → Analyzing form inputs...');

        // Handle text inputs and textareas with autocomplete
        const textInputs = await page.$$('input[type="text"], input:not([type]), textarea');
        for (const input of textInputs) {
          const placeholder = await input.getAttribute('placeholder');
          const name = await input.getAttribute('name');
          const label = name || placeholder || 'unknown';

          // Clear existing value first
          await input.click();
          await humanDelay(100, 200);
          await input.selectText().catch(() => {});
          await input.press('Backspace');
          await humanDelay(100, 200);

          // Determine what to fill based on field type
          if (label.toLowerCase().includes('job') || label.toLowerCase().includes('title') || label.toLowerCase().includes('position')) {
            console.log(`    → Filling job title field`);
            await input.type('Software Engineer', { delay: 80 });
            await humanDelay(1000, 1500);

            // Wait for and click autocomplete dropdown
            const dropdownOptions = await page.$$('[role="option"], [role="listbox"] > *, .ListItem__Container, [class*="list-item"], [class*="dropdown-item"], [class*="suggestion"]');
            if (dropdownOptions.length > 0) {
              console.log(`    → Found ${dropdownOptions.length} autocomplete options, selecting first`);
              await dropdownOptions[0].click();
              await humanDelay(500, 800);
            } else {
              await input.press('Enter');
            }
          } else if (label.toLowerCase().includes('email')) {
            await input.fill('test@example.com');
          } else if (label.toLowerCase().includes('phone')) {
            await input.fill('555-0100');
          } else if (label.toLowerCase().includes('company')) {
            await input.fill('Test Company Inc');
          } else if (label.toLowerCase().includes('location') || label.toLowerCase().includes('city')) {
            await input.fill('San Francisco');
          } else {
            await input.fill('Test Data');
          }
          await humanDelay(200, 400);
        }

        // Handle select dropdowns
        const selects = await page.$$('select');
        if (selects.length > 0) {
          console.log(`    → Found ${selects.length} select dropdown(s)`);
          for (const select of selects) {
            const options = await select.$$('option');
            if (options.length > 1) {
              // Select the second option (first is usually a placeholder)
              await select.selectOption({ index: 1 });
              await humanDelay(300, 500);
            }
          }
        }

        // COMPREHENSIVE OPTION SELECTION (radio, checkbox, button, toggle)
        // Look for "Start from scratch" / "From scratch" / "Blank" option
        console.log(`    → Looking for option selection elements...`);

        // Method 1: Radio buttons
        const radios = await page.$$('input[type="radio"]:not(:checked)');
        let foundScratchOption = false;

        if (radios.length > 0) {
          console.log(`    → Found ${radios.length} radio button(s)`);
          for (const radio of radios) {
            const label = await radio.evaluate(r => {
              const parent = r.closest('label') || r.parentElement;
              return parent?.textContent?.toLowerCase() || '';
            });
            if (label.includes('scratch') || label.includes('from scratch') || label.includes('blank') || label.includes('start from')) {
              console.log(`    → Clicking "Start from scratch" radio button`);
              await radio.click();
              await humanDelay(400, 600);
              foundScratchOption = true;
              break;
            }
          }
          // If no scratch option, click first radio
          if (!foundScratchOption && radios.length > 0) {
            await radios[0].click();
            await humanDelay(400, 600);
          }
        }

        // Method 2: Checkboxes (for "start from scratch" or similar)
        if (!foundScratchOption) {
          const checkboxes = await page.$$('input[type="checkbox"]:not(:checked)');
          if (checkboxes.length > 0) {
            console.log(`    → Found ${checkboxes.length} checkbox(es)`);
            for (const checkbox of checkboxes) {
              const label = await checkbox.evaluate(c => {
                const parent = c.closest('label') || c.parentElement;
                return parent?.textContent?.toLowerCase() || '';
              });
              if (label.includes('scratch') || label.includes('from scratch') || label.includes('blank') || label.includes('start from')) {
                console.log(`    → Clicking "Start from scratch" checkbox`);
                await checkbox.click();
                await humanDelay(400, 600);
                foundScratchOption = true;
                break;
              }
            }
            // If no scratch option and few checkboxes, check first one
            if (!foundScratchOption && checkboxes.length <= 3) {
              await checkboxes[0].click();
              await humanDelay(300, 500);
            }
          }
        }

        // Method 3: Buttons or clickable elements (like card-style options)
        if (!foundScratchOption) {
          const scratchButtons = await page.$$(
            'button:has-text("Start from Scratch"), button:has-text("From Scratch"), button:has-text("Blank"), ' +
            'div[role="button"]:has-text("Start from Scratch"), div[role="button"]:has-text("From Scratch"), ' +
            'a:has-text("Start from Scratch"), a:has-text("From Scratch"), ' +
            '[class*="option"]:has-text("Start from Scratch"), [class*="card"]:has-text("Start from Scratch")'
          );
          if (scratchButtons.length > 0) {
            console.log(`    → Found ${scratchButtons.length} "Start from scratch" button/option`);
            await scratchButtons[0].click();
            await humanDelay(500, 800);
            foundScratchOption = true;
          }
        }

        // Method 4: Toggle switches
        const toggles = await page.$$('[role="switch"], input[type="checkbox"][role="switch"]');
        if (toggles.length > 0) {
          console.log(`    → Found ${toggles.length} toggle switch(es)`);
          for (const toggle of toggles) {
            const isChecked = await toggle.isChecked().catch(() => false);
            if (!isChecked) {
              await toggle.click();
              await humanDelay(300, 500);
              break;
            }
          }
        }

        // Handle date inputs
        const dateInputs = await page.$$('input[type="date"]');
        for (const dateInput of dateInputs) {
          await dateInput.fill('2024-01-15');
          await humanDelay(200, 400);
        }

        // Try to find and click Continue/Submit button after filling
        // Wait longer for form validation to complete
        await humanDelay(1000, 1500);

        // Try multiple times to find an enabled Continue button (form validation may take time)
        let continueBtn = null;
        let attemptsLeft = 5;
        while (attemptsLeft > 0) {
          continueBtn = await page.$('button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit"), button[type="submit"]');
          if (continueBtn) {
            const isEnabled = await continueBtn.isEnabled();
            if (isEnabled) {
              console.log(`    → Found enabled Continue button, clicking it`);
              await continueBtn.click();
              await page.waitForLoadState('networkidle').catch(() => {});
              await humanDelay(1000, 1500);
              break;
            } else {
              console.log(`    → Continue button found but disabled, waiting for validation... (${attemptsLeft} attempts left)`);
              await humanDelay(800, 1200);
              attemptsLeft--;
            }
          } else {
            break;
          }
        }

        console.log(`  ✓ Filled form fields with comprehensive input handling`);
        actionLog.success = true;
        actionLog.details.textInputsFilled = textInputs.length;
        actionLog.details.selectsFilled = selects.length;
        actionLog.details.foundScratchOption = foundScratchOption;
        actionLog.details.continueBtnFound = continueBtn !== null;
        actionLog.details.pageUrl = await page.url();
        aiState.actionLog.push(actionLog);
        return true;

      default:
        console.log(`  ⚠ Unknown action type: ${action.type}`);
        return false;
    }

    console.log(`  ⚠ Could not find element: ${action.target}`);
    actionLog.error = 'Element not found';
    actionLog.details.reason = 'Could not locate element with given selector/text';
    aiState.actionLog.push(actionLog);
    aiState.executionErrors.push({
      timestamp: new Date().toISOString(),
      iteration: aiState.iteration,
      action: action.type,
      target: action.target,
      error: 'Element not found',
      message: `Could not find element: ${action.target}`
    });
    return false;

  } catch (error) {
    console.log(`  ❌ Error executing action: ${error.message}`);
    actionLog.error = error.message;
    actionLog.details.stack = error.stack;
    aiState.actionLog.push(actionLog);
    aiState.executionErrors.push({
      timestamp: new Date().toISOString(),
      iteration: aiState.iteration,
      action: action.type,
      target: action.target,
      error: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * MAIN AI-GUIDED ANALYSIS
 */
async function aiGuidedAnalysis(credentials) {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  try {
    console.log('\n' + '='.repeat(100));
    console.log('🤖 AI-GUIDED HUNTR.CO ANALYZER');
    console.log('Claude AI + Playwright working together to achieve 100% feature discovery');
    console.log('='.repeat(100));

    // LOGIN
    console.log('\n🔐 Logging in...');
    await page.goto(config.baseUrl);
    await humanDelay(2000, 3000);
    await detectProtections(page);

    // Click "Log in" button in navigation
    console.log('  → Looking for Log in button...');
    const loginBtn = await page.locator('text=Log in').first();
    const loginBtnVisible = await loginBtn.isVisible().catch(() => false);

    if (loginBtnVisible) {
      console.log('  → Clicking Log in button...');
      await loginBtn.click();
      await page.waitForLoadState('networkidle');
      await humanDelay(2000, 3000);
    } else {
      console.log('  → Navigating directly to login page...');
      await page.goto(`${config.baseUrl}/login`);
      await humanDelay(2000, 3000);
    }

    // Wait for login form to appear
    console.log('  → Waiting for login form...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await humanDelay(1000, 2000);

    // Fill email
    console.log('  → Entering email...');
    const emailField = await page.locator('input[type="email"], input[name="email"]').first();
    await emailField.click();
    await emailField.fill(credentials.email);
    await humanDelay(500, 1000);

    // Fill password
    console.log('  → Entering password...');
    const passwordField = await page.locator('input[type="password"], input[name="password"]').first();
    await passwordField.click();
    await passwordField.fill(credentials.password);
    await humanDelay(1000, 2000);

    // Submit form
    console.log('  → Submitting login form...');
    const submitBtn = await page.locator('button:has-text("Log In"), button:has-text("Log in"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    await humanDelay(3000, 5000);
    await detectProtections(page);

    console.log('  ✓ Login successful!');

    // Dismiss any popups after login
    await dismissPopupsAndModals(page);
    await humanDelay(1000, 1500);

    // AI-GUIDED EXPLORATION LOOP
    for (aiState.iteration = 1; aiState.iteration <= config.maxIterations; aiState.iteration++) {
      console.log('\n' + '='.repeat(100));
      console.log(`ITERATION ${aiState.iteration}/${config.maxIterations}`);
      console.log(`Goal: ${aiState.currentGoal}`);
      console.log(`Coverage: ${aiState.explorationCoverage}%`);
      console.log('='.repeat(100));

      // Dismiss popups before capturing state
      await dismissPopupsAndModals(page);

      // Capture current page state
      const pageName = `iter${aiState.iteration}-${new Date().getTime()}`;
      const pageState = await capturePageState(page, pageName);

      // STUCK DETECTION: Check if we've been on the same page for too long
      const currentUrl = pageState.pageData.url;
      const recentPages = aiState.exploredPages.slice(-8); // Last 8 actions
      const sameUrlActions = recentPages.filter(p => p.url === currentUrl).length;

      // Also check if we're repeating the same failed actions
      const recentActions = aiState.actionLog.slice(-5);
      const failedActions = recentActions.filter(a => !a.success).length;
      const repeatingFailures = failedActions >= 4;

      if ((sameUrlActions >= 5 && aiState.iteration > 5) || repeatingFailures) {
        console.log('\n⚠️  STUCK DETECTION TRIGGERED:');
        if (sameUrlActions >= 5) {
          console.log(`    → Been on same URL for ${sameUrlActions} consecutive actions`);
        }
        if (repeatingFailures) {
          console.log(`    → ${failedActions}/5 recent actions failed`);
        }
        console.log(`    Current URL: ${currentUrl}`);
        console.log('    → Forcing navigation to unexplored area to break loop...');

        // Clean up old attempts (older than 5 iterations)
        aiState.stuckDetectionAttempts = aiState.stuckDetectionAttempts.filter(attempt =>
          aiState.iteration - attempt.iteration <= 5
        );

        // Try to find an unexplored section to navigate to
        const unexploredSections = [
          { url: '/track/settings', name: 'Settings' },
          { url: '/track/profile', name: 'Profile' },
          { url: '/track/companies', name: 'Companies' },
          { url: '/track/contacts', name: 'Contacts' },
          { url: '/track/documents', name: 'Documents' },
          { url: '/track/metrics', name: 'Metrics' },
          { url: '/track/boards', name: 'Boards' },
          { url: '/track/activities', name: 'Activities' },
          { url: '/track/welcome', name: 'Welcome' }
        ];

        let navigated = false;
        for (const section of unexploredSections) {
          // Check if visited OR recently attempted in stuck detection
          const visited = aiState.exploredPages.some(p =>
            p.url && p.url.includes(section.url)
          );
          const recentlyAttempted = aiState.stuckDetectionAttempts.some(a =>
            a.url === section.url
          );

          if (!visited && !recentlyAttempted) {
            console.log(`  → Navigating to unexplored: ${section.name}`);
            aiState.stuckDetectionAttempts.push({
              iteration: aiState.iteration,
              url: section.url,
              name: section.name
            });
            await dismissPopupsAndModals(page); // Dismiss before navigating
            await page.goto(`${config.baseUrl}${section.url}`).catch(() => {});
            navigated = true;
            break;
          } else if (recentlyAttempted) {
            console.log(`  ⏭️  Skipping ${section.name} - recently attempted`);
          }
        }

        // If all sections visited or attempted, go to welcome page
        if (!navigated) {
          console.log(`  → All sections visited or attempted, going to welcome page`);
          await dismissPopupsAndModals(page);
          await page.goto(`${config.baseUrl}/track/welcome`).catch(() => {});
        }

        await humanDelay(2000, 3000);
        await dismissPopupsAndModals(page);
        continue; // Skip to next iteration
      }

      // Ask Claude AI what to do next
      const guidance = await askClaudeForGuidance(pageState, aiState);

      // Stop if Claude thinks we have good coverage
      if (guidance.estimatedCoverage >= 95) {
        console.log('\n✅ Claude AI reports 95%+ coverage achieved!');
        break;
      }

      // Execute Claude's recommended actions (top 5 by priority)
      // Filter out upgrade/pricing actions and previously explored actions
      const sortedActions = (guidance.nextActions || [])
        .filter(action => {
          // Skip upgrade/pricing related actions
          const isUpgradeAction = action.target?.toLowerCase().includes('upgrade') ||
                                 action.target?.toLowerCase().includes('pricing') ||
                                 action.elementText?.toLowerCase().includes('upgrade') ||
                                 action.elementText?.toLowerCase().includes('pricing');

          // Skip Chrome extension links (external navigation)
          const isChromeExtension = action.target?.includes('chrome.google.com') ||
                                   action.target?.includes('webstore') ||
                                   action.elementText?.toLowerCase().includes('extension') ||
                                   action.elementText?.toLowerCase().includes('get the extension');

          // Improved duplicate detection - check both target AND URL
          const alreadyExplored = aiState.exploredPages.some(p => {
            const sameAction = p.name === action.target && p.type === action.type;
            const sameUrlContext = p.url === currentUrl;
            return sameAction && sameUrlContext;
          });

          // Count how many times we've tried clicking this exact element
          const clickCount = aiState.exploredPages.filter(p =>
            p.name === action.target && p.type === action.type
          ).length;

          // Skip if we've tried this action 3+ times already
          const tooManyAttempts = clickCount >= 3;

          if (isUpgradeAction) {
            console.log(`  ⏭️  Skipping upgrade-related action: ${action.target}`);
          }
          if (isChromeExtension) {
            console.log(`  ⏭️  Skipping Chrome extension link: ${action.target}`);
          }
          if (alreadyExplored) {
            console.log(`  ⏭️  Skipping already explored on this page: ${action.target} (${action.type})`);
          }
          if (tooManyAttempts) {
            console.log(`  ⏭️  Skipping - attempted ${clickCount} times already: ${action.target}`);
          }

          return !isUpgradeAction && !isChromeExtension && !alreadyExplored && !tooManyAttempts;
        })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5);

      // If no valid actions remain, force navigate to an unexplored section
      if (sortedActions.length === 0 && aiState.iteration < config.maxIterations) {
        console.log('\n⚠️  No valid actions found - forcing navigation to unexplored area...');
        const unexploredSections = [
          { url: '/track/boards', name: 'Boards' },
          { url: '/track/contacts', name: 'Contacts' },
          { url: '/track/companies', name: 'Companies' },
          { url: '/track/documents', name: 'Documents' },
          { url: '/track/metrics', name: 'Metrics' },
          { url: '/track/settings', name: 'Settings' },
          { url: '/track/profile', name: 'Profile' }
        ];

        for (const section of unexploredSections) {
          const visited = aiState.exploredPages.some(p =>
            p.url && p.url.includes(section.url)
          );
          if (!visited) {
            console.log(`  → Navigating to unexplored section: ${section.name}`);
            await page.goto(`${config.baseUrl}${section.url}`).catch(() => {});
            await humanDelay(1000, 1500);
            await dismissPopupsAndModals(page);
            continue; // Skip to next iteration
          }
        }
      }

      for (const action of sortedActions) {
        // CRITICAL: Dismiss modals BEFORE every action to prevent blocking
        await dismissPopupsAndModals(page);
        await humanDelay(200, 300);

        const success = await executeAction(page, action);

        if (success) {
          // Capture state after action
          await humanDelay(300, 500); // Reduced from 1000-2000ms
          const afterState = await capturePageState(page, `${pageName}-after-${action.type}`);

          // Log this as explored
          aiState.exploredPages.push({
            name: action.target,
            type: action.type,
            url: afterState.pageData.url,
            iteration: aiState.iteration,
            timestamp: new Date().toISOString()
          });

          await humanDelay(200, 400); // Reduced from 1000-2000ms
          break; // CRITICAL FIX: Only execute ONE action per iteration to ensure each page is analyzed
        }
      }
    }

    // SAVE DATABASES TO FILES
    console.log('\n💾 Saving comprehensive databases...');

    // Save elements database - comprehensive element data from all pages
    await fs.writeFile(
      ELEMENTS_DATABASE,
      JSON.stringify(aiState.elementsDatabase, null, 2)
    );
    console.log(`  ✓ Elements database saved: ${Object.keys(aiState.elementsDatabase).length} pages`);

    // Save pages database - complete page structures
    await fs.writeFile(
      PAGES_DATABASE,
      JSON.stringify(aiState.pagesDatabase, null, 2)
    );
    console.log(`  ✓ Pages database saved: ${Object.keys(aiState.pagesDatabase).length} pages`);

    // Save action log - detailed execution history
    await fs.writeFile(
      path.join(ANALYSIS_DIR, 'action-log.json'),
      JSON.stringify(aiState.actionLog, null, 2)
    );
    console.log(`  ✓ Action log saved: ${aiState.actionLog.length} actions logged`);

    // Save execution errors - debugging information
    await fs.writeFile(
      path.join(ANALYSIS_DIR, 'execution-errors.json'),
      JSON.stringify(aiState.executionErrors, null, 2)
    );
    console.log(`  ✓ Execution errors saved: ${aiState.executionErrors.length} errors logged`);

    // GENERATE FINAL REPORT
    console.log('\n📊 Generating AI-guided analysis report...');

    const finalReport = {
      timestamp: new Date().toISOString(),
      model: config.claudeModel,
      iterations: aiState.iteration,
      finalCoverage: aiState.explorationCoverage,
      totalDecisions: aiState.aiDecisions.length,
      pagesExplored: aiState.exploredPages.length,
      featuresDiscovered: aiState.discoveredFeatures,
      screenshots: aiState.screenshots.length,
      htmlPages: aiState.htmlPages.length,
      totalElementsTracked: Object.keys(aiState.elementsDatabase).length,
      totalPagesTracked: Object.keys(aiState.pagesDatabase).length,
      aiDecisions: aiState.aiDecisions
    };

    await fs.writeFile(
      path.join(REPORTS_DIR, 'AI-GUIDED-REPORT.json'),
      JSON.stringify(finalReport, null, 2)
    );

    const markdown = `# AI-Guided Huntr.co Analysis Report

**Generated**: ${finalReport.timestamp}
**AI Model**: ${finalReport.model}
**Iterations**: ${finalReport.iterations}
**Final Coverage**: ${finalReport.finalCoverage}%

## Summary
- **AI Decisions Made**: ${finalReport.totalDecisions}
- **Pages Explored**: ${finalReport.pagesExplored}
- **HTML Pages Captured**: ${finalReport.htmlPages}
- **Screenshots Captured**: ${finalReport.screenshots}
- **Features Discovered**: ${finalReport.featuresDiscovered.length}
- **Pages in Elements Database**: ${finalReport.totalElementsTracked}
- **Pages in Pages Database**: ${finalReport.totalPagesTracked}

## Features Discovered by AI
${finalReport.featuresDiscovered.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## AI Decision Timeline
${aiState.aiDecisions.map((decision, i) => `
### Decision ${i + 1} - Iteration ${decision.iteration}
**Page**: ${decision.page}

**Analysis**: ${decision.analysis}

**Actions Recommended**: ${decision.actions.length}
${decision.actions.slice(0, 3).map(a => `- [P${a.priority}] ${a.type}: "${a.target}" - ${a.reason}`).join('\n')}

**Coverage**: ${decision.coverage}%
`).join('\n---\n')}

## Data Files for Cloning

### Comprehensive Databases
1. **Elements Database**: \`${ELEMENTS_DATABASE}\`
   - Complete element data from all explored pages
   - CSS selectors, XPath, element states, and properties
   - Perfect for rebuilding UI components

2. **Pages Database**: \`${PAGES_DATABASE}\`
   - Full page structures and HTML snapshots
   - Form configurations and field relationships
   - Navigation patterns and page flows

3. **AI Decisions Log**: \`${AI_DECISIONS_LOG}\`
   - Claude AI's analysis and reasoning
   - Action recommendations and priorities
   - Feature discovery timeline

### Directory Structure
- **HTML Files**: \`${HTML_DIR}\` - Raw HTML snapshots of each page state
- **Element Files**: \`${ELEMENTS_DIR}\` - JSON element data per page
- **Reports**: \`${REPORTS_DIR}\` - Analysis summaries and findings

## Next Steps
1. Review comprehensive databases: \`${ELEMENTS_DATABASE}\` and \`${PAGES_DATABASE}\`
2. Review HTML snapshots in: \`${HTML_DIR}\`
3. Review AI decisions in: \`${AI_DECISIONS_LOG}\`
4. Use element database to rebuild UI components with exact selectors
5. Use pages database to understand application flow and structure
`;

    await fs.writeFile(path.join(REPORTS_DIR, 'AI-SUMMARY.md'), markdown);

    console.log('\n' + '='.repeat(100));
    console.log('✅ AI-GUIDED ANALYSIS COMPLETE!');
    console.log('='.repeat(100));
    console.log(`\n📁 Results Directory: ${ANALYSIS_DIR}`);
    console.log(`\n📊 Analysis Summary:`);
    console.log(`  🧠 AI Decisions: ${aiState.aiDecisions.length} made`);
    console.log(`  📄 HTML Pages: ${aiState.htmlPages.length} captured`);
    console.log(`  📸 Screenshots: ${aiState.screenshots.length} captured`);
    console.log(`  🎯 Features Found: ${aiState.discoveredFeatures.length}`);
    console.log(`  📈 Coverage: ${aiState.explorationCoverage}%`);
    console.log(`\n💾 Comprehensive Databases:`);
    console.log(`  🗃️  Elements Database: ${Object.keys(aiState.elementsDatabase).length} pages`);
    console.log(`  📚 Pages Database: ${Object.keys(aiState.pagesDatabase).length} pages`);
    console.log(`  📋 AI Decisions Log: ${AI_DECISIONS_LOG}`);
    console.log(`\n📂 Data Locations:`);
    console.log(`  HTML: ${HTML_DIR}`);
    console.log(`  Elements: ${ELEMENTS_DIR}`);
    console.log(`  Reports: ${REPORTS_DIR}\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'fatal-error.png') });
  } finally {
    await browser.close();
  }
}

// Main
async function main() {
  console.log('📝 Loading credentials from .credentials file...');

  // Load credentials from file
  const credentials = await loadCredentials();

  // Validate required credentials
  if (!credentials.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .credentials file');
    console.log('\nAdd it to .credentials file:');
    console.log('ANTHROPIC_API_KEY=sk-ant-api03-...');
    process.exit(1);
  }

  if (!credentials.HUNTR_EMAIL || !credentials.HUNTR_PASSWORD) {
    console.error('❌ HUNTR_EMAIL or HUNTR_PASSWORD not found in .credentials file');
    console.log('\nAdd them to .credentials file:');
    console.log('HUNTR_EMAIL=your@email.com');
    console.log('HUNTR_PASSWORD=your-password');
    process.exit(1);
  }

  // Initialize Claude AI with credentials
  anthropic = new Anthropic({
    apiKey: credentials.ANTHROPIC_API_KEY
  });

  console.log('✅ Credentials loaded successfully\n');

  await setupDirectories();
  await aiGuidedAnalysis({
    email: credentials.HUNTR_EMAIL,
    password: credentials.HUNTR_PASSWORD
  });
}

// Run if called directly
main().catch(console.error);
