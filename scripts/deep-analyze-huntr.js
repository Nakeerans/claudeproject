const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * DEEP HUNTR.CO ANALYSIS SCRIPT
 *
 * This script performs comprehensive, iterative analysis by:
 * - Clicking every clickable element
 * - Opening every modal/popup
 * - Hovering over every interactive element
 * - Following every navigation path
 * - Capturing all states and interactions
 * - Multiple iterations until 100% feature coverage
 */

const ANALYSIS_DIR = path.join(__dirname, '../huntr-deep-analysis');
const SCREENSHOTS_DIR = path.join(ANALYSIS_DIR, 'screenshots');
const REPORTS_DIR = path.join(ANALYSIS_DIR, 'reports');
const INTERACTIONS_DIR = path.join(ANALYSIS_DIR, 'interactions');

const config = {
  baseUrl: 'https://huntr.co',
  headless: false,
  slowMo: 300,
  timeout: 30000,
  maxIterations: 3, // Run analysis 3 times to catch everything
  explorationDepth: 5 // How many clicks deep to explore
};

// Global state tracking
const exploredStates = new Set();
const discoveredElements = new Map();
const apiCalls = [];
const allAnalysis = {
  timestamp: new Date().toISOString(),
  pages: [],
  interactions: [],
  modals: [],
  forms: [],
  apiEndpoints: [],
  colorScheme: {},
  frameworkInfo: {}
};

async function setupDirectories() {
  await fs.mkdir(ANALYSIS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.mkdir(INTERACTIONS_DIR, { recursive: true });
}

function generateStateId(url, elementInfo) {
  return `${url}-${JSON.stringify(elementInfo)}`;
}

const humanDelay = async (page, min = 1000, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await page.waitForTimeout(delay);
};

async function detectProtections(page) {
  // CAPTCHA detection
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    'div[class*="captcha"]'
  ];

  for (const selector of captchaSelectors) {
    const element = await page.$(selector);
    if (element) {
      console.log('\n⚠️  CAPTCHA detected! Waiting 60s for manual solving...');
      await page.waitForTimeout(60000);
      return;
    }
  }

  // Rate limiting detection
  const content = await page.content();
  if (content.toLowerCase().includes('rate limit') || content.toLowerCase().includes('too many requests')) {
    console.log('\n⚠️  Rate limit detected! Waiting 30s...');
    await page.waitForTimeout(30000);
  }
}

/**
 * COMPREHENSIVE PAGE ANALYSIS
 * Extracts EVERYTHING from the page
 */
async function deepAnalyzePage(page, pageName, iteration = 1) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 DEEP ANALYSIS: ${pageName} (Iteration ${iteration})`);
  console.log(`${'='.repeat(80)}`);

  const timestamp = Date.now();
  const analysis = {
    pageName,
    iteration,
    url: page.url(),
    timestamp: new Date().toISOString(),
    viewport: page.viewportSize(),
    elements: {},
    interactions: [],
    features: []
  };

  // 1. Screenshot - multiple states
  console.log('\n📸 Capturing screenshots...');
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${timestamp}-${pageName}-full.png`),
    fullPage: true
  });

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${timestamp}-${pageName}-viewport.png`),
    fullPage: false
  });
  console.log('  ✓ Screenshots captured');

  // 2. Extract ALL navigation elements
  console.log('\n🧭 Analyzing navigation...');
  analysis.elements.navigation = await page.evaluate(() => {
    const navElements = [];
    const selectors = [
      'nav a',
      'aside a',
      '[role="navigation"] a',
      'header a',
      '[class*="sidebar"] a',
      '[class*="nav"] a',
      '[class*="menu"] a'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      navElements.push({
        text: el.textContent?.trim(),
        href: el.getAttribute('href'),
        classes: el.className,
        id: el.id,
        icon: el.querySelector('svg, i, img')?.outerHTML?.substring(0, 200),
        isActive: el.classList.contains('active') || el.getAttribute('aria-current') === 'page',
        parent: el.closest('[class*="menu"], [role="menu"]')?.className,
        dataAttributes: Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})
      });
    });

    return navElements;
  });
  console.log(`  ✓ Found ${analysis.elements.navigation.length} navigation items`);

  // 3. Extract ALL buttons and clickable elements
  console.log('\n🔘 Analyzing buttons and actions...');
  analysis.elements.buttons = await page.evaluate(() => {
    const buttons = [];
    const selectors = [
      'button',
      'a[class*="btn"]',
      '[role="button"]',
      'input[type="button"]',
      'input[type="submit"]',
      '[class*="button"]'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      const rect = el.getBoundingClientRect();
      buttons.push({
        tag: el.tagName,
        text: el.textContent?.trim(),
        type: el.type,
        classes: el.className,
        id: el.id,
        ariaLabel: el.getAttribute('aria-label'),
        icon: el.querySelector('svg, i')?.outerHTML?.substring(0, 200),
        disabled: el.disabled,
        position: { x: Math.round(rect.x), y: Math.round(rect.y) },
        size: { width: Math.round(rect.width), height: Math.round(rect.height) },
        parentContext: el.closest('[class*="card"], [class*="modal"], [class*="header"], [class*="footer"]')?.className,
        dataAttributes: Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})
      });
    });

    return buttons;
  });
  console.log(`  ✓ Found ${analysis.elements.buttons.length} interactive buttons`);

  // 4. Extract ALL headings with hierarchy
  console.log('\n📝 Analyzing content structure...');
  analysis.elements.headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(el => ({
      tag: el.tagName,
      level: parseInt(el.tagName.charAt(1)),
      text: el.textContent?.trim(),
      classes: el.className,
      id: el.id,
      parentSection: el.closest('section, article, [class*="section"], [class*="container"]')?.className
    }));
  });
  console.log(`  ✓ Found ${analysis.elements.headings.length} headings`);

  // 5. Extract ALL form elements with complete details
  console.log('\n📋 Analyzing forms...');
  analysis.elements.forms = await page.evaluate(() => {
    const forms = [];

    document.querySelectorAll('form').forEach(form => {
      const formData = {
        id: form.id,
        name: form.name,
        action: form.action,
        method: form.method,
        classes: form.className,
        fields: []
      };

      form.querySelectorAll('input, textarea, select').forEach(field => {
        const fieldData = {
          tag: field.tagName,
          type: field.type || field.tagName,
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          value: field.value,
          required: field.required,
          disabled: field.disabled,
          readonly: field.readOnly,
          pattern: field.pattern,
          min: field.min,
          max: field.max,
          minLength: field.minLength,
          maxLength: field.maxLength,
          label: field.labels?.[0]?.textContent?.trim(),
          classes: field.className
        };

        // For select fields, get options
        if (field.tagName === 'SELECT') {
          fieldData.options = Array.from(field.options).map(opt => ({
            value: opt.value,
            text: opt.text,
            selected: opt.selected
          }));
        }

        formData.fields.push(fieldData);
      });

      forms.push(formData);
    });

    return forms;
  });
  console.log(`  ✓ Found ${analysis.elements.forms.length} forms`);

  // 6. Detect Kanban board columns with full details
  console.log('\n🎯 Analyzing Kanban board structure...');
  analysis.elements.kanban = await page.evaluate(() => {
    const columnSelectors = [
      '[class*="column"]',
      '[class*="list"]',
      '[class*="lane"]',
      '[class*="board-column"]',
      '[data-column]',
      '[data-stage]'
    ];

    const columns = [];
    document.querySelectorAll(columnSelectors.join(', ')).forEach((col, index) => {
      const headerSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[class*="title"]', '[class*="heading"]'];
      let title = null;
      for (const selector of headerSelectors) {
        const header = col.querySelector(selector);
        if (header) {
          title = header.textContent?.trim();
          break;
        }
      }

      const cardSelectors = ['[class*="card"]', '[class*="item"]', '[draggable="true"]'];
      const cards = col.querySelectorAll(cardSelectors.join(', '));

      const rect = col.getBoundingClientRect();
      const styles = window.getComputedStyle(col);

      columns.push({
        index,
        title,
        subtitle: col.querySelector('[class*="subtitle"], [class*="count"]')?.textContent?.trim(),
        classes: col.className,
        id: col.id,
        dataAttributes: Array.from(col.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}),
        itemCount: cards.length,
        hasAddButton: col.querySelector('button[class*="add"], button:has-text("Add"), button:has-text("+")') !== null,
        position: { x: Math.round(rect.x), y: Math.round(rect.y) },
        size: { width: Math.round(rect.width), height: Math.round(rect.height) },
        styles: {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          padding: styles.padding
        }
      });
    });

    return { columns, hasKanban: columns.length > 0 };
  });

  if (analysis.elements.kanban.hasKanban) {
    console.log(`  ✓ Found Kanban board with ${analysis.elements.kanban.columns.length} columns`);
    analysis.features.push('Kanban Board');
  }

  // 7. Extract ALL cards with structured data
  console.log('\n🎴 Analyzing card structures...');
  analysis.elements.cards = await page.evaluate(() => {
    const cardSelectors = ['[class*="card"]', '[class*="item"]', '[draggable="true"]'];
    const cards = [];

    document.querySelectorAll(cardSelectors.join(', ')).forEach((card, index) => {
      // Helper to find field by multiple selectors
      const findField = (selectors) => {
        for (const selector of selectors) {
          const elem = card.querySelector(selector);
          if (elem && elem.textContent?.trim()) {
            return elem.textContent.trim();
          }
        }
        return null;
      };

      const rect = card.getBoundingClientRect();

      const cardData = {
        index,
        id: card.id || card.getAttribute('data-id') || card.getAttribute('data-card-id'),
        classes: card.className,
        draggable: card.getAttribute('draggable') === 'true',

        // Try to extract structured fields
        title: findField(['[class*="title"]', '[class*="job-title"]', 'h3', 'h4', 'h5', '.card-title', 'strong']),
        company: findField(['[class*="company"]', '[class*="organization"]', '.company-name', '[class*="employer"]']),
        location: findField(['[class*="location"]', '[class*="place"]', '[class*="city"]']),
        salary: findField(['[class*="salary"]', '[class*="compensation"]', '[class*="pay"]', '[class*="wage"]']),
        date: findField(['[class*="date"]', '[class*="time"]', 'time', '[class*="posted"]', '[class*="applied"]']),
        status: findField(['[class*="status"]', '[class*="stage"]', '.badge', '[class*="label"]']),

        // Extract all text as fallback
        fullText: card.textContent?.trim().substring(0, 500),

        // Visual elements
        hasAvatar: card.querySelector('img[class*="avatar"], img[class*="logo"], img[class*="icon"]') !== null,
        avatarSrc: card.querySelector('img[class*="avatar"], img[class*="logo"], img[class*="icon"]')?.src,

        hasStar: card.querySelector('[class*="star"], [class*="favorite"], [class*="bookmark"]') !== null,

        // Tags and badges
        tags: Array.from(card.querySelectorAll('[class*="tag"], [class*="badge"], [class*="chip"], [class*="label"]'))
          .map(tag => tag.textContent?.trim()).filter(Boolean),

        // Actions
        buttons: Array.from(card.querySelectorAll('button, a[class*="btn"]')).map(btn => ({
          text: btn.textContent?.trim(),
          classes: btn.className,
          ariaLabel: btn.getAttribute('aria-label'),
          icon: btn.querySelector('svg, i')?.outerHTML?.substring(0, 100)
        })),

        // Position and styling
        position: { x: Math.round(rect.x), y: Math.round(rect.y) },
        size: { width: Math.round(rect.width), height: Math.round(rect.height) },

        // Data attributes
        dataAttributes: Array.from(card.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}),

        // Partial HTML
        innerHTML: card.innerHTML.substring(0, 1000)
      };

      cards.push(cardData);
    });

    return cards;
  });
  console.log(`  ✓ Found ${analysis.elements.cards.length} cards with structured data`);

  // 8. Extract color scheme and design tokens
  console.log('\n🎨 Extracting color scheme...');
  analysis.colorScheme = await page.evaluate(() => {
    const root = document.documentElement;
    const rootStyles = window.getComputedStyle(root);
    const bodyStyles = window.getComputedStyle(document.body);

    // Extract CSS variables
    const cssVariables = {};
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith('--')) {
        cssVariables[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }

    // Extract button colors
    const primaryBtn = document.querySelector('[class*="btn-primary"], [class*="button-primary"], .btn-primary');
    const secondaryBtn = document.querySelector('[class*="btn-secondary"], [class*="button-secondary"], .btn-secondary');
    const dangerBtn = document.querySelector('[class*="btn-danger"], [class*="button-danger"], .btn-danger');

    return {
      cssVariables,
      body: {
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color,
        fontFamily: bodyStyles.fontFamily
      },
      buttons: {
        primary: primaryBtn ? {
          backgroundColor: window.getComputedStyle(primaryBtn).backgroundColor,
          color: window.getComputedStyle(primaryBtn).color,
          borderRadius: window.getComputedStyle(primaryBtn).borderRadius
        } : null,
        secondary: secondaryBtn ? {
          backgroundColor: window.getComputedStyle(secondaryBtn).backgroundColor,
          color: window.getComputedStyle(secondaryBtn).color
        } : null,
        danger: dangerBtn ? {
          backgroundColor: window.getComputedStyle(dangerBtn).backgroundColor,
          color: window.getComputedStyle(dangerBtn).color
        } : null
      }
    };
  });
  console.log('  ✓ Color scheme extracted');

  // 9. Detect drag-and-drop implementation
  console.log('\n🔄 Detecting drag-and-drop...');
  analysis.dragDrop = await page.evaluate(() => {
    const draggable = document.querySelectorAll('[draggable="true"], [data-rbd-draggable-id], [data-dnd-draggable-id]');
    const droppable = document.querySelectorAll('[data-droppable="true"], [data-rbd-droppable-id], [data-dnd-droppable-id]');

    return {
      hasDragDrop: draggable.length > 0 || droppable.length > 0,
      draggableCount: draggable.length,
      droppableCount: droppable.length,
      library: window.ReactBeautifulDnd ? 'react-beautiful-dnd' :
               document.querySelector('[data-dnd-draggable-id]') ? '@dnd-kit' :
               draggable.length > 0 ? 'native-html5' : 'none',
      implementation: {
        hasReactBeautifulDnd: !!window.ReactBeautifulDnd,
        hasDndKit: !!document.querySelector('[data-dnd-draggable-id]'),
        hasNativeDraggable: draggable.length > 0
      }
    };
  });

  if (analysis.dragDrop.hasDragDrop) {
    console.log(`  ✓ Drag-and-drop detected: ${analysis.dragDrop.library}`);
    analysis.features.push(`Drag and Drop (${analysis.dragDrop.library})`);
  }

  // 10. Detect framework and build tools
  console.log('\n⚙️  Detecting framework...');
  analysis.frameworkInfo = await page.evaluate(() => {
    return {
      hasReact: !!window.React || !!document.querySelector('[data-reactroot], [data-reactid]'),
      reactVersion: window.React?.version,
      hasVue: !!window.Vue,
      vueVersion: window.Vue?.version,
      hasAngular: !!window.angular || !!window.ng,
      buildTool: document.querySelector('script[src*="vite"]') ? 'Vite' :
                 document.querySelector('script[src*="webpack"]') ? 'Webpack' :
                 document.querySelector('script[src*="parcel"]') ? 'Parcel' :
                 'Unknown',
      hasTypeScript: !!document.querySelector('script[type*="typescript"]'),
      hasTailwind: !!Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(rule =>
            rule.selectorText?.includes('tailwind') ||
            rule.cssText?.includes('tailwind')
          );
        } catch (e) {
          return false;
        }
      })
    };
  });
  console.log(`  ✓ Framework: ${analysis.frameworkInfo.hasReact ? 'React' : 'Unknown'}`);

  // Save analysis
  const reportPath = path.join(REPORTS_DIR, `${timestamp}-${pageName}-iteration-${iteration}.json`);
  await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n💾 Analysis saved: ${reportPath}`);

  return analysis;
}

/**
 * HOVER OVER ELEMENTS
 * Discovers tooltips, dropdowns, and hover states
 */
async function exploreHoverStates(page, pageName) {
  console.log(`\n🖱️  Exploring hover states for: ${pageName}`);

  const hoverableSelectors = [
    'button',
    'a',
    '[class*="card"]',
    '[class*="item"]',
    '[class*="icon"]',
    '[role="button"]'
  ];

  const hoverStates = [];

  for (const selector of hoverableSelectors) {
    const elements = await page.$$(selector);

    for (let i = 0; i < Math.min(elements.length, 10); i++) {
      try {
        const element = elements[i];
        const elementInfo = await element.evaluate(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          classes: el.className
        }));

        await element.hover();
        await page.waitForTimeout(500);

        // Check for tooltips, dropdowns
        const hasTooltip = await page.$('[role="tooltip"], [class*="tooltip"], [class*="popover"]');
        const hasDropdown = await page.$('[role="menu"], [class*="dropdown"], [class*="menu"]');

        if (hasTooltip || hasDropdown) {
          const timestamp = Date.now();
          await page.screenshot({
            path: path.join(INTERACTIONS_DIR, `${timestamp}-hover-${i}.png`)
          });

          hoverStates.push({
            element: elementInfo,
            hasTooltip: !!hasTooltip,
            hasDropdown: !!hasDropdown,
            screenshot: `${timestamp}-hover-${i}.png`
          });

          console.log(`  ✓ Captured hover state: ${elementInfo.text || elementInfo.tag}`);
        }

        await humanDelay(page, 300, 600);
      } catch (e) {
        // Element might have disappeared
        continue;
      }
    }
  }

  console.log(`  ✓ Explored ${hoverStates.length} hover interactions`);
  return hoverStates;
}

/**
 * CLICK AND EXPLORE MODALS
 * Opens every modal, popup, dialog
 */
async function exploreModalsAndPopups(page, pageName) {
  console.log(`\n🪟 Exploring modals and popups for: ${pageName}`);

  const modalTriggerSelectors = [
    'button:has-text("Add")',
    'button:has-text("New")',
    'button:has-text("Create")',
    'button:has-text("Edit")',
    'button[class*="add"]',
    'button[class*="create"]',
    'a[class*="add"]',
    '[aria-haspopup="dialog"]'
  ];

  const modals = [];

  for (const selector of modalTriggerSelectors) {
    const triggers = await page.$$(selector);

    for (let i = 0; i < Math.min(triggers.length, 5); i++) {
      try {
        const trigger = triggers[i];
        const triggerText = await trigger.textContent();

        console.log(`  Clicking: "${triggerText?.trim()}"`);
        await trigger.click();
        await humanDelay(page, 1000, 2000);

        // Check if modal opened
        const modal = await page.$('[role="dialog"], [class*="modal"], [class*="popup"], [class*="dialog"]');

        if (modal) {
          const timestamp = Date.now();

          // Capture modal screenshot
          await page.screenshot({
            path: path.join(INTERACTIONS_DIR, `${timestamp}-modal-${i}.png`),
            fullPage: true
          });

          // Analyze modal structure
          const modalData = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"], [class*="modal"]');
            if (!modal) return null;

            return {
              title: modal.querySelector('h1, h2, h3, [class*="title"]')?.textContent?.trim(),
              classes: modal.className,
              buttons: Array.from(modal.querySelectorAll('button')).map(btn => ({
                text: btn.textContent?.trim(),
                type: btn.type,
                classes: btn.className
              })),
              inputs: Array.from(modal.querySelectorAll('input, textarea, select')).map(input => ({
                type: input.type || input.tagName,
                name: input.name,
                placeholder: input.placeholder,
                label: input.labels?.[0]?.textContent?.trim()
              })),
              innerHTML: modal.innerHTML.substring(0, 2000)
            };
          });

          modals.push({
            trigger: triggerText?.trim(),
            screenshot: `${timestamp}-modal-${i}.png`,
            ...modalData
          });

          console.log(`  ✓ Captured modal: ${modalData.title}`);

          // Close modal
          const closeButton = await page.$('[class*="close"], button:has-text("Cancel"), button:has-text("Close")');
          if (closeButton) {
            await closeButton.click();
            await humanDelay(page, 500, 1000);
          } else {
            await page.keyboard.press('Escape');
            await humanDelay(page, 500, 1000);
          }
        }

        await humanDelay(page, 1000, 2000);
      } catch (e) {
        console.log(`  ⚠ Error exploring modal: ${e.message}`);
        continue;
      }
    }
  }

  console.log(`  ✓ Explored ${modals.length} modals/popups`);
  return modals;
}

/**
 * MAIN DEEP ANALYSIS FUNCTION
 */
async function deepAnalyzeHuntr(credentials) {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US'
  });

  const page = await context.newPage();

  // Hide webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
    }
  });

  try {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 STARTING DEEP HUNTR.CO ANALYSIS');
    console.log('='.repeat(80));

    // LOGIN
    console.log('\n📍 Navigating to Huntr.co...');
    await page.goto(config.baseUrl);
    await humanDelay(page, 2000, 4000);
    await detectProtections(page);

    await deepAnalyzePage(page, '01-homepage', 1);

    // Find and click login
    console.log('\n🔐 Logging in...');
    const loginSelectors = ['text=Sign in', 'text=Log in', 'a[href*="login"]'];
    for (const selector of loginSelectors) {
      try {
        await page.click(selector);
        await page.waitForLoadState('networkidle');
        break;
      } catch (e) {
        continue;
      }
    }

    await humanDelay(page, 1000, 2000);
    await deepAnalyzePage(page, '02-login-page', 1);

    // Fill login form
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', credentials.email, { delay: 100 + Math.random() * 100 });
    await humanDelay(page, 500, 1000);

    await page.click('input[type="password"]');
    await page.type('input[type="password"]', credentials.password, { delay: 100 + Math.random() * 100 });
    await humanDelay(page, 1000, 2000);

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await humanDelay(page, 3000, 5000);
    await detectProtections(page);

    console.log('  ✓ Login successful!');

    // MAIN ANALYSIS LOOP - Multiple iterations
    for (let iteration = 1; iteration <= config.maxIterations; iteration++) {
      console.log(`\n${'#'.repeat(80)}`);
      console.log(`# ITERATION ${iteration} of ${config.maxIterations}`);
      console.log(`${'#'.repeat(80)}`);

      // Analyze dashboard
      await deepAnalyzePage(page, '03-dashboard', iteration);

      // Find all navigation links dynamically
      const navLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('nav a, aside a, [role="navigation"] a'))
          .map(a => ({
            text: a.textContent?.trim(),
            href: a.getAttribute('href')
          }))
          .filter(link => link.href && !link.href.includes('logout'));
      });

      console.log(`\n🔗 Found ${navLinks.length} navigation links to explore`);

      // Explore each page
      for (const link of navLinks) {
        try {
          console.log(`\n➡️  Navigating to: ${link.text}`);
          await page.click(`a[href="${link.href}"]`);
          await page.waitForLoadState('networkidle');
          await humanDelay(page, 2000, 4000);
          await detectProtections(page);

          const pageName = link.text.toLowerCase().replace(/\s+/g, '-');

          // Deep analysis of this page
          const pageAnalysis = await deepAnalyzePage(page, pageName, iteration);
          allAnalysis.pages.push(pageAnalysis);

          // Explore hover states
          const hoverStates = await exploreHoverStates(page, pageName);
          allAnalysis.interactions.push({ page: pageName, hoverStates });

          // Explore modals
          const modals = await exploreModalsAndPopups(page, pageName);
          allAnalysis.modals.push({ page: pageName, modals });

          await humanDelay(page, 2000, 3000);
        } catch (e) {
          console.log(`  ⚠ Error exploring ${link.text}: ${e.message}`);
          continue;
        }
      }
    }

    // Save API calls
    allAnalysis.apiEndpoints = [...new Set(apiCalls.map(call => `${call.method} ${call.url}`))];

    // Generate final report
    console.log('\n📊 Generating comprehensive report...');
    await fs.writeFile(
      path.join(REPORTS_DIR, 'COMPLETE-ANALYSIS.json'),
      JSON.stringify(allAnalysis, null, 2)
    );

    // Generate summary
    const summary = `# Huntr.co Deep Analysis Report

**Generated**: ${new Date().toISOString()}
**Iterations**: ${config.maxIterations}
**Pages Analyzed**: ${allAnalysis.pages.length}
**Modals Captured**: ${allAnalysis.modals.reduce((sum, m) => sum + m.modals.length, 0)}
**API Endpoints**: ${allAnalysis.apiEndpoints.length}

## Framework
- React: ${allAnalysis.pages[0]?.frameworkInfo.hasReact ? 'Yes' : 'No'}
- Version: ${allAnalysis.pages[0]?.frameworkInfo.reactVersion || 'N/A'}
- Build Tool: ${allAnalysis.pages[0]?.frameworkInfo.buildTool}
- Tailwind: ${allAnalysis.pages[0]?.frameworkInfo.hasTailwind ? 'Yes' : 'No'}

## Features Detected
${[...new Set(allAnalysis.pages.flatMap(p => p.features))].map(f => `- ${f}`).join('\n')}

## API Endpoints
${allAnalysis.apiEndpoints.map(e => `- ${e}`).join('\n')}

## Next Steps
1. Review screenshots in: ${SCREENSHOTS_DIR}
2. Review interaction captures in: ${INTERACTIONS_DIR}
3. Review detailed JSON reports in: ${REPORTS_DIR}
4. Use data to rebuild exact clone
`;

    await fs.writeFile(path.join(REPORTS_DIR, 'SUMMARY.md'), summary);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEEP ANALYSIS COMPLETE!');
    console.log('='.repeat(80));
    console.log(`\n📁 Results: ${ANALYSIS_DIR}`);
    console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}`);
    console.log(`🖱️  Interactions: ${INTERACTIONS_DIR}`);
    console.log(`📊 Reports: ${REPORTS_DIR}\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

// Main
async function main() {
  const email = process.env.HUNTR_EMAIL || process.argv[2];
  const password = process.env.HUNTR_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('❌ Credentials required\n');
    console.log('Usage: node deep-analyze-huntr.js <email> <password>');
    process.exit(1);
  }

  await setupDirectories();
  await deepAnalyzeHuntr({ email, password });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deepAnalyzeHuntr };
