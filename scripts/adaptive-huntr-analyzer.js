const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * ADAPTIVE HUNTR.CO ANALYZER
 *
 * This script intelligently learns the application structure by:
 * 1. Discovering ALL navigation items dynamically
 * 2. Following every link and exploring every page
 * 3. Clicking every button to discover modals/features
 * 4. Adapting to the actual structure found
 * 5. Multiple iterations until 100% coverage
 * 6. Self-reporting what it learned and what to explore next
 */

const ANALYSIS_DIR = path.join(__dirname, '../huntr-adaptive-analysis');
const SCREENSHOTS_DIR = path.join(ANALYSIS_DIR, 'screenshots');
const REPORTS_DIR = path.join(ANALYSIS_DIR, 'reports');
const LEARNING_LOG = path.join(ANALYSIS_DIR, 'learning-log.json');

const config = {
  baseUrl: 'https://huntr.co',
  headless: false,
  slowMo: 400,
  timeout: 30000,
  maxIterations: 5,
  maxDepth: 6  // How many levels deep to explore
};

// Learning state - persists across runs
const learningState = {
  discoveredPages: new Map(),
  discoveredElements: new Map(),
  exploredInteractions: new Set(),
  pendingExplorations: [],
  completedExplorations: new Set(),
  iteration: 0,
  features: new Set(),
  screenshots: [],
  modalsCaptured: []
};

async function setupDirectories() {
  await fs.mkdir(ANALYSIS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true});
}

async function saveLearningState() {
  const stateToSave = {
    ...learningState,
    discoveredPages: Array.from(learningState.discoveredPages.entries()),
    discoveredElements: Array.from(learningState.discoveredElements.entries()),
    exploredInteractions: Array.from(learningState.exploredInteractions),
    completedExplorations: Array.from(learningState.completedExplorations),
    features: Array.from(learningState.features)
  };

  await fs.writeFile(LEARNING_LOG, JSON.stringify(stateToSave, null, 2));
}

function humanDelay(min = 1000, max = 3000) {
  return new Promise(resolve => {
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min);
  });
}

async function detectProtections(page) {
  const captchaSelectors = ['iframe[src*="recaptcha"]', 'iframe[src*="hcaptcha"]'];
  for (const selector of captchaSelectors) {
    if (await page.$(selector)) {
      console.log('\n⚠️  CAPTCHA detected! Please solve manually...');
      console.log('   Waiting 90 seconds...\n');
      await page.waitForTimeout(90000);
      return true;
    }
  }

  const content = await page.content();
  if (content.toLowerCase().includes('rate limit')) {
    console.log('\n⚠️  Rate limit detected! Waiting 45 seconds...\n');
    await page.waitForTimeout(45000);
    return true;
  }

  return false;
}

/**
 * DISCOVER NAVIGATION - Find ALL menu items dynamically
 */
async function discoverNavigation(page) {
  console.log('\n🧭 Discovering navigation structure...');

  const navigation = await page.evaluate(() => {
    const navItems = [];

    // Comprehensive selectors for navigation
    const selectors = [
      'nav a',
      'aside a',
      '[role="navigation"] a',
      'header a',
      '[class*="sidebar"] a',
      '[class*="nav"] a',
      '[class*="menu"] a',
      'div[class*="navigation"] a',
      // Left sidebar specific
      'div[class*="left"] a',
      'div[class*="side"] a'
    ];

    const allLinks = new Set();

    document.querySelectorAll(selectors.join(', ')).forEach(el => {
      const href = el.getAttribute('href');
      const text = el.textContent?.trim();

      if (href && text && !href.includes('logout') && !href.includes('sign-out')) {
        allLinks.add(JSON.stringify({
          text,
          href,
          fullUrl: href.startsWith('http') ? href : window.location.origin + href,
          icon: el.querySelector('svg, i, img')?.outerHTML?.substring(0, 150) || null,
          classes: el.className,
          id: el.id,
          parent: el.closest('[class*="menu"], [class*="nav"]')?.getAttribute('class') || null,
          isNested: el.closest('ul ul, li li') !== null,
          hasSubMenu: el.closest('li')?.querySelector('ul') !== null
        }));
      }
    });

    return Array.from(allLinks).map(item => JSON.parse(item));
  });

  // Store discovered navigation
  navigation.forEach(nav => {
    learningState.discoveredPages.set(nav.href, {
      ...nav,
      explored: false,
      depth: 1
    });
  });

  console.log(`  ✓ Discovered ${navigation.length} navigation items`);
  navigation.forEach(nav => {
    console.log(`    - ${nav.text} → ${nav.href}${nav.hasSubMenu ? ' (has submenu)' : ''}`);
  });

  return navigation;
}

/**
 * DISCOVER PAGE ELEMENTS - Find all interactive elements on current page
 */
async function discoverPageElements(page, pageName) {
  console.log(`\n🔍 Discovering elements on: ${pageName}`);

  const elements = await page.evaluate(() => {
    const discovered = {
      buttons: [],
      forms: [],
      modals: [],
      tabs: [],
      dropdowns: [],
      links: [],
      sections: []
    };

    // Buttons and clickable elements
    document.querySelectorAll('button, [role="button"], a[class*="button"], a[class*="btn"]').forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // Skip hidden

      discovered.buttons.push({
        index: idx,
        text: el.textContent?.trim().substring(0, 100),
        type: el.tagName,
        classes: el.className,
        id: el.id,
        ariaLabel: el.getAttribute('aria-label'),
        dataAttributes: Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}),
        position: { x: Math.round(rect.x), y: Math.round(rect.y) },
        visible: rect.width > 0 && rect.height > 0,
        likelyModal: el.textContent?.toLowerCase().includes('add') ||
                     el.textContent?.toLowerCase().includes('create') ||
                     el.textContent?.toLowerCase().includes('new') ||
                     el.textContent?.toLowerCase().includes('edit') ||
                     el.getAttribute('aria-haspopup') === 'dialog'
      });
    });

    // Forms
    document.querySelectorAll('form').forEach((form, idx) => {
      discovered.forms.push({
        index: idx,
        id: form.id,
        action: form.action,
        method: form.method,
        fieldCount: form.querySelectorAll('input, textarea, select').length,
        fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
          type: field.type || field.tagName,
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          required: field.required
        }))
      });
    });

    // Tabs
    document.querySelectorAll('[role="tab"], [class*="tab"]').forEach((tab, idx) => {
      discovered.tabs.push({
        index: idx,
        text: tab.textContent?.trim(),
        classes: tab.className,
        active: tab.classList.contains('active') || tab.getAttribute('aria-selected') === 'true'
      });
    });

    // Dropdowns/Selects
    document.querySelectorAll('select, [role="combobox"], [class*="dropdown"]').forEach((dd, idx) => {
      discovered.dropdowns.push({
        index: idx,
        type: dd.tagName,
        text: dd.textContent?.trim().substring(0, 50),
        classes: dd.className,
        optionsCount: dd.tagName === 'SELECT' ? dd.options.length : null
      });
    });

    // Section headings (helps understand page structure)
    document.querySelectorAll('h1, h2, h3').forEach(heading => {
      discovered.sections.push({
        level: heading.tagName,
        text: heading.textContent?.trim(),
        classes: heading.className
      });
    });

    return discovered;
  });

  console.log(`  ✓ Found ${elements.buttons.length} buttons`);
  console.log(`  ✓ Found ${elements.forms.length} forms`);
  console.log(`  ✓ Found ${elements.tabs.length} tabs`);
  console.log(`  ✓ Found ${elements.dropdowns.length} dropdowns`);
  console.log(`  ✓ Found ${elements.sections.length} section headings`);

  // Log likely modal triggers
  const modalButtons = elements.buttons.filter(b => b.likelyModal);
  if (modalButtons.length > 0) {
    console.log(`  📝 Found ${modalButtons.length} likely modal triggers:`);
    modalButtons.forEach(b => console.log(`    - "${b.text}"`));
  }

  return elements;
}

/**
 * CAPTURE PAGE STATE - Screenshot and full analysis
 */
async function capturePageState(page, pageName, context = '') {
  const timestamp = Date.now();
  const screenshotName = `${timestamp}-${pageName}${context ? '-' + context : ''}.png`;

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, screenshotName),
    fullPage: true
  });

  learningState.screenshots.push({
    timestamp,
    page: pageName,
    context,
    file: screenshotName,
    url: page.url()
  });

  console.log(`  📸 Screenshot: ${screenshotName}`);

  return screenshotName;
}

/**
 * EXPLORE INTERACTIONS - Click buttons, open modals, fill forms
 */
async function exploreInteractions(page, elements, pageName) {
  console.log(`\n🖱️  Exploring interactions on ${pageName}...`);

  let interactionsCount = 0;

  // Try clicking modal-triggering buttons
  for (const button of elements.buttons.filter(b => b.likelyModal).slice(0, 5)) {
    const interactionId = `${pageName}-button-${button.index}`;

    if (learningState.exploredInteractions.has(interactionId)) {
      continue; // Already explored
    }

    try {
      console.log(`  🔘 Clicking: "${button.text}"`);

      // Find and click the button
      const buttonElement = await page.$$('button, [role="button"], a[class*="button"]');
      if (buttonElement[button.index]) {
        await buttonElement[button.index].click();
        await humanDelay(1000, 2000);

        // Check if modal appeared
        const modal = await page.$('[role="dialog"], [class*="modal"], [class*="popup"]');

        if (modal) {
          console.log(`    ✓ Modal opened!`);

          // Capture modal
          const modalScreenshot = await capturePageState(page, pageName, `modal-${button.text.substring(0, 20).replace(/\s+/g, '-')}`);

          // Analyze modal content
          const modalData = await page.evaluate(() => {
            const modalEl = document.querySelector('[role="dialog"], [class*="modal"]');
            if (!modalEl) return null;

            return {
              title: modalEl.querySelector('h1, h2, h3, [class*="title"]')?.textContent?.trim(),
              hasForm: !!modalEl.querySelector('form'),
              inputs: Array.from(modalEl.querySelectorAll('input, textarea, select')).map(input => ({
                type: input.type || input.tagName,
                name: input.name,
                placeholder: input.placeholder,
                label: input.labels?.[0]?.textContent?.trim()
              })),
              buttons: Array.from(modalEl.querySelectorAll('button')).map(btn => ({
                text: btn.textContent?.trim(),
                type: btn.type
              })),
              content: modalEl.textContent?.trim().substring(0, 500)
            };
          });

          learningState.modalsCaptured.push({
            trigger: button.text,
            page: pageName,
            screenshot: modalScreenshot,
            ...modalData
          });

          console.log(`    📋 Modal: "${modalData?.title}"`);
          console.log(`    📝 Has ${modalData?.inputs?.length || 0} input fields`);

          // Close modal
          const closeBtn = await page.$('[aria-label*="close" i], [class*="close"], button:has-text("Cancel"), button:has-text("Close")');
          if (closeBtn) {
            await closeBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }

          await humanDelay(500, 1000);
          interactionsCount++;
        }

        learningState.exploredInteractions.add(interactionId);
      }
    } catch (e) {
      console.log(`    ⚠ Error: ${e.message}`);
    }
  }

  // Explore tabs
  if (elements.tabs.length > 0) {
    console.log(`  🗂️  Exploring ${elements.tabs.length} tabs...`);

    for (let i = 0; i < Math.min(elements.tabs.length, 5); i++) {
      try {
        const tabElements = await page.$$('[role="tab"], [class*="tab"]');
        if (tabElements[i]) {
          const tabText = elements.tabs[i].text;
          console.log(`    Clicking tab: "${tabText}"`);

          await tabElements[i].click();
          await humanDelay(1000, 2000);
          await capturePageState(page, pageName, `tab-${tabText.substring(0, 20).replace(/\s+/g, '-')}`);

          interactionsCount++;
        }
      } catch (e) {
        console.log(`    ⚠ Tab error: ${e.message}`);
      }
    }
  }

  console.log(`  ✓ Completed ${interactionsCount} interactions`);
  return interactionsCount;
}

/**
 * EXPLORE PAGE - Deep dive into a single page
 */
async function explorePage(page, pageInfo, depth = 1) {
  const { text, href, fullUrl } = pageInfo;
  const pageName = text.toLowerCase().replace(/\s+/g, '-');

  console.log(`\n${'  '.repeat(depth - 1)}📍 Exploring: ${text} (Depth ${depth})`);
  console.log(`${'  '.repeat(depth - 1)}   URL: ${href}`);

  try {
    // Navigate to page
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanDelay(2000, 4000);
    await detectProtections(page);

    // Capture initial state
    await capturePageState(page, pageName, 'initial');

    // Discover all elements
    const elements = await discoverPageElements(page, pageName);

    // Discover any sub-navigation on this page
    const subNav = await discoverNavigation(page);

    // Explore interactions
    await exploreInteractions(page, elements, pageName);

    // Save page data
    const pageData = {
      name: pageName,
      text,
      url: page.url(),
      href,
      depth,
      timestamp: new Date().toISOString(),
      elements,
      subNavigation: subNav.filter(nav => !learningState.discoveredPages.has(nav.href))
    };

    // Save report
    await fs.writeFile(
      path.join(REPORTS_DIR, `${Date.now()}-${pageName}.json`),
      JSON.stringify(pageData, null, 2)
    );

    // Mark as explored
    learningState.discoveredPages.set(href, {
      ...learningState.discoveredPages.get(href),
      explored: true,
      exploredAt: new Date().toISOString(),
      depth
    });
    learningState.completedExplorations.add(href);

    // If we found new sub-navigation and haven't reached max depth, add to pending
    if (depth < config.maxDepth && pageData.subNavigation.length > 0) {
      pageData.subNavigation.forEach(subPage => {
        if (!learningState.completedExplorations.has(subPage.href)) {
          learningState.pendingExplorations.push({
            ...subPage,
            depth: depth + 1,
            parent: text
          });
        }
      });
    }

    await saveLearningState();

  } catch (error) {
    console.log(`  ❌ Error exploring ${text}: ${error.message}`);
  }
}

/**
 * MAIN ANALYSIS LOOP
 */
async function analyzeHuntr(credentials) {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      learningState.features.add(`API: ${request.method()} ${request.url()}`);
    }
  });

  try {
    console.log('\n' + '='.repeat(100));
    console.log('🤖 ADAPTIVE HUNTR.CO ANALYZER - LEARNING MODE');
    console.log('='.repeat(100));

    // LOGIN
    console.log('\n🔐 Logging in...');
    await page.goto(config.baseUrl);
    await humanDelay(2000, 4000);
    await detectProtections(page);
    await capturePageState(page, '00-homepage', 'before-login');

    // Find login
    const loginButton = await page.$('text=Sign in') || await page.$('text=Log in') || await page.$('a[href*="login"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      await humanDelay(1000, 2000);
    }

    await capturePageState(page, '00-login-page', '');

    // Fill login
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', credentials.email, { delay: 100 + Math.random() * 100 });
    await humanDelay(500, 1000);

    await page.click('input[type="password"]');
    await page.type('input[type="password"]', credentials.password, { delay: 100 + Math.random() * 100 });
    await humanDelay(1000, 2000);

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await humanDelay(3000, 5000);
    await detectProtections(page);

    console.log('  ✓ Login successful!');
    await capturePageState(page, '01-dashboard', 'after-login');

    // DISCOVERY PHASE
    for (learningState.iteration = 1; learningState.iteration <= config.maxIterations; learningState.iteration++) {
      console.log('\n' + '#'.repeat(100));
      console.log(`# ITERATION ${learningState.iteration} / ${config.maxIterations} - DISCOVERY & EXPLORATION`);
      console.log('#'.repeat(100));

      // Discover navigation on current page
      const navigation = await discoverNavigation(page);

      // Add all navigation to pending if not already explored
      navigation.forEach(nav => {
        if (!learningState.completedExplorations.has(nav.href)) {
          learningState.pendingExplorations.push({ ...nav, depth: 1, parent: 'root' });
        }
      });

      // Explore all pending pages
      while (learningState.pendingExplorations.length > 0) {
        const pageToExplore = learningState.pendingExplorations.shift();
        await explorePage(page, pageToExplore, pageToExplore.depth);
        await humanDelay(2000, 3000);
      }

      console.log(`\n✅ Iteration ${learningState.iteration} complete!`);
      console.log(`   📊 Total pages explored: ${learningState.completedExplorations.size}`);
      console.log(`   🖱️  Total interactions: ${learningState.exploredInteractions.size}`);
      console.log(`   🪟  Total modals captured: ${learningState.modalsCaptured.length}`);
      console.log(`   📸 Total screenshots: ${learningState.screenshots.length}`);
    }

    // GENERATE COMPREHENSIVE REPORT
    console.log('\n📊 Generating final analysis report...');

    const finalReport = {
      timestamp: new Date().toISOString(),
      iterations: learningState.iteration,
      summary: {
        totalPages: learningState.discoveredPages.size,
        exploredPages: learningState.completedExplorations.size,
        totalInteractions: learningState.exploredInteractions.size,
        modalsCaptured: learningState.modalsCaptured.length,
        screenshots: learningState.screenshots.length,
        features: Array.from(learningState.features)
      },
      pages: Array.from(learningState.discoveredPages.entries()).map(([href, data]) => ({
        href,
        ...data
      })),
      modals: learningState.modalsCaptured,
      explorationCoverage: `${Math.round((learningState.completedExplorations.size / learningState.discoveredPages.size) * 100)}%`
    };

    await fs.writeFile(
      path.join(REPORTS_DIR, 'FINAL-REPORT.json'),
      JSON.stringify(finalReport, null, 2)
    );

    const markdown = `# Huntr.co Adaptive Analysis - Final Report

**Generated**: ${finalReport.timestamp}
**Iterations**: ${finalReport.iterations}
**Exploration Coverage**: ${finalReport.explorationCoverage}

## Summary
- **Total Pages Discovered**: ${finalReport.summary.totalPages}
- **Pages Explored**: ${finalReport.summary.exploredPages}
- **Interactions Tested**: ${finalReport.summary.totalInteractions}
- **Modals Captured**: ${finalReport.summary.modalsCaptured}
- **Screenshots**: ${finalReport.summary.screenshots}

## Pages Explored
${Array.from(learningState.completedExplorations).map(href => {
  const page = learningState.discoveredPages.get(href);
  return `- ${page.text} → ${href}`;
}).join('\n')}

## Modals Captured
${learningState.modalsCaptured.map((modal, idx) =>
  `${idx + 1}. **${modal.title || 'Untitled'}** (Trigger: "${modal.trigger}")\n   - ${modal.inputs?.length || 0} inputs\n   - Screenshot: ${modal.screenshot}`
).join('\n')}

## Features Detected
${Array.from(learningState.features).map(f => `- ${f}`).join('\n')}

## Next Steps
1. Review screenshots in: \`${SCREENSHOTS_DIR}\`
2. Review page reports in: \`${REPORTS_DIR}\`
3. Use findings to rebuild exact Huntr.co clone
`;

    await fs.writeFile(path.join(REPORTS_DIR, 'SUMMARY.md'), markdown);

    console.log('\n' + '='.repeat(100));
    console.log('✅ ADAPTIVE ANALYSIS COMPLETE!');
    console.log('='.repeat(100));
    console.log(`\n📁 Analysis saved to: ${ANALYSIS_DIR}`);
    console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}`);
    console.log(`📊 Reports: ${REPORTS_DIR}\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'fatal-error.png') });
  } finally {
    await saveLearningState();
    await browser.close();
  }
}

// Main
async function main() {
  const email = process.env.HUNTR_EMAIL || process.argv[2];
  const password = process.env.HUNTR_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('❌ Credentials required');
    console.log('\nUsage: node adaptive-huntr-analyzer.js <email> <password>');
    process.exit(1);
  }

  await setupDirectories();
  await analyzeHuntr({ email, password });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeHuntr };
