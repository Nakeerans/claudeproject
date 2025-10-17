const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * Automated Huntr.co Analysis Script
 * This script logs into Huntr.co, navigates through all pages,
 * captures screenshots, and documents all features for cloning.
 */

const ANALYSIS_DIR = path.join(__dirname, '../huntr-analysis');
const SCREENSHOTS_DIR = path.join(ANALYSIS_DIR, 'screenshots');
const REPORTS_DIR = path.join(ANALYSIS_DIR, 'reports');

// Configuration
const config = {
  baseUrl: 'https://huntr.co',
  headless: false, // Set to true for headless mode
  slowMo: 500, // Slow down actions for observation
  timeout: 30000
};

async function setupDirectories() {
  await fs.mkdir(ANALYSIS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

async function capturePageAnalysis(page, pageName) {
  console.log(`\n📸 Analyzing: ${pageName}`);

  const analysis = {
    pageName,
    url: page.url(),
    timestamp: new Date().toISOString(),
    elements: {},
    features: []
  };

  // Capture screenshot
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${pageName.replace(/\s+/g, '-').toLowerCase()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`  ✓ Screenshot saved: ${screenshotPath}`);

  // Analyze page structure
  try {
    // Get navigation items
    const navItems = await page.$$eval('[role="navigation"] a, nav a, aside a',
      elements => elements.map(el => ({
        text: el.textContent?.trim(),
        href: el.getAttribute('href'),
        classes: el.className
      }))
    );
    analysis.elements.navigation = navItems;
    console.log(`  ✓ Found ${navItems.length} navigation items`);

    // Get all buttons
    const buttons = await page.$$eval('button',
      elements => elements.map(el => ({
        text: el.textContent?.trim(),
        type: el.type,
        classes: el.className,
        ariaLabel: el.getAttribute('aria-label')
      }))
    );
    analysis.elements.buttons = buttons.slice(0, 20); // Limit for readability
    console.log(`  ✓ Found ${buttons.length} buttons`);

    // Get all headings
    const headings = await page.$$eval('h1, h2, h3',
      elements => elements.map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim()
      }))
    );
    analysis.elements.headings = headings;
    console.log(`  ✓ Found ${headings.length} headings`);

    // Get all input fields
    const inputs = await page.$$eval('input, textarea, select',
      elements => elements.map(el => ({
        type: el.type || el.tagName,
        placeholder: el.placeholder,
        name: el.name,
        label: el.labels?.[0]?.textContent?.trim()
      }))
    );
    analysis.elements.inputs = inputs;
    console.log(`  ✓ Found ${inputs.length} input fields`);

    // Check for drag-and-drop or Kanban board
    const hasDraggable = await page.$$eval('[draggable="true"], [data-droppable="true"]',
      elements => elements.length > 0
    ).catch(() => false);
    if (hasDraggable) {
      analysis.features.push('Drag and Drop / Kanban Board');
      console.log(`  ✓ Feature: Drag and Drop detected`);
    }

    // Get column/list structure
    const columns = await page.$$eval('[class*="column"], [class*="list"], [class*="lane"]',
      elements => elements.map(el => ({
        text: el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim(),
        classes: el.className,
        itemCount: el.querySelectorAll('[class*="card"], [class*="item"]').length
      }))
    );
    if (columns.length > 0) {
      analysis.elements.columns = columns;
      console.log(`  ✓ Found ${columns.length} columns/lists`);
    }

    // Get cards structure
    const cards = await page.$$eval('[class*="card"], [class*="item"]',
      elements => elements.slice(0, 10).map(el => ({
        text: el.textContent?.trim().substring(0, 200),
        classes: el.className
      }))
    );
    if (cards.length > 0) {
      analysis.elements.cards = cards;
      console.log(`  ✓ Found ${cards.length} cards/items`);
    }

  } catch (error) {
    console.log(`  ⚠ Error analyzing page: ${error.message}`);
    analysis.error = error.message;
  }

  // Save analysis
  const reportPath = path.join(REPORTS_DIR, `${pageName.replace(/\s+/g, '-').toLowerCase()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`  ✓ Analysis saved: ${reportPath}`);

  return analysis;
}

async function analyzeHuntr(credentials) {
  // Use stealth mode to avoid bot detection
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
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: [],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(config.timeout);

  // Hide webdriver property
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  const allAnalysis = {
    timestamp: new Date().toISOString(),
    pages: []
  };

  // Helper function to add random human-like delays
  const humanDelay = async (min = 1000, max = 3000) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await page.waitForTimeout(delay);
  };

  // Helper function to detect CAPTCHA
  const detectCaptcha = async () => {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      'div[class*="captcha"]',
      '#captcha',
      '.g-recaptcha',
      '.h-captcha'
    ];

    for (const selector of captchaSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log('\n⚠️  CAPTCHA detected!');
        console.log('   Please solve the CAPTCHA manually in the browser window...');
        console.log('   Waiting for 60 seconds...\n');
        await page.waitForTimeout(60000);
        return true;
      }
    }
    return false;
  };

  // Helper function to detect rate limiting
  const detectRateLimit = async () => {
    const content = await page.content();
    const rateLimitIndicators = [
      'too many requests',
      'rate limit',
      'try again later',
      '429',
      'slow down'
    ];

    for (const indicator of rateLimitIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        console.log('\n⚠️  Rate limiting detected!');
        console.log('   Waiting 30 seconds before continuing...\n');
        await page.waitForTimeout(30000);
        return true;
      }
    }
    return false;
  };

  try {
    console.log('\n🚀 Starting Huntr.co Analysis...\n');
    console.log('⚙️  Using stealth mode to avoid bot detection');
    console.log('🐢 Adding human-like delays between actions\n');

    // 1. Go to Huntr.co login page
    console.log('📍 Navigating to Huntr.co...');
    await page.goto(config.baseUrl, { waitUntil: 'networkidle' });
    await humanDelay(2000, 4000);
    await detectCaptcha();
    await detectRateLimit();
    await capturePageAnalysis(page, '01-homepage');

    // 2. Login
    console.log('\n🔐 Attempting login...');

    // Check if we need to click a login/signin button first
    const loginButtonSelectors = [
      'text=Sign in',
      'text=Log in',
      'text=Login',
      'a[href*="login"]',
      'button:has-text("Sign in")'
    ];

    for (const selector of loginButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForLoadState('networkidle');
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    await capturePageAnalysis(page, '02-login-page');

    // Try to find and fill login form
    console.log('  Filling credentials with human-like typing...');

    // Try different email field selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]'
    ];

    for (const selector of emailSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        await humanDelay(500, 1000);
        // Type with human-like delays
        await page.type(selector, credentials.email, { delay: 100 + Math.random() * 100 });
        console.log(`  ✓ Email filled using: ${selector}`);
        await humanDelay(500, 1500);
        break;
      } catch (e) {
        continue;
      }
    }

    // Try different password field selectors
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id*="password"]'
    ];

    for (const selector of passwordSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        await humanDelay(500, 1000);
        // Type with human-like delays
        await page.type(selector, credentials.password, { delay: 100 + Math.random() * 100 });
        console.log(`  ✓ Password filled using: ${selector}`);
        await humanDelay(1000, 2000);
        break;
      } catch (e) {
        continue;
      }
    }

    // Try to submit the form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'input[type="submit"]'
    ];

    for (const selector of submitSelectors) {
      try {
        await page.click(selector);
        console.log(`  ✓ Login submitted using: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    await humanDelay(3000, 5000);

    // Check for CAPTCHA after login
    await detectCaptcha();
    await detectRateLimit();

    console.log('  ✓ Login successful!');
    await capturePageAnalysis(page, '03-dashboard-after-login');

    // 3. Navigate through main pages
    console.log('\n🗺️  Exploring Huntr.co pages...');
    const pagesToExplore = [
      { name: 'Board/Kanban', paths: ['/track', '/board', '/jobs'] },
      { name: 'Contacts', paths: ['/contacts', '/network'] },
      { name: 'Interviews', paths: ['/interviews', '/calendar'] },
      { name: 'Documents', paths: ['/documents', '/files'] },
      { name: 'Activities', paths: ['/activities', '/activity'] },
      { name: 'Metrics', paths: ['/metrics', '/analytics', '/stats'] },
      { name: 'Settings', paths: ['/settings', '/profile'] }
    ];

    for (const pageInfo of pagesToExplore) {
      console.log(`\n🔍 Looking for: ${pageInfo.name}`);

      // Try finding via navigation links first
      const navText = [
        pageInfo.name,
        pageInfo.name.toLowerCase(),
        pageInfo.name.split('/')[0]
      ];

      let found = false;
      for (const text of navText) {
        try {
          const link = await page.$(`a:has-text("${text}")`);
          if (link) {
            await humanDelay(1000, 2000);
            await link.click();
            await page.waitForLoadState('networkidle');
            await humanDelay(2000, 4000);
            await detectCaptcha();
            await detectRateLimit();
            await capturePageAnalysis(page, `04-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}`);
            found = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Try direct paths if nav link not found
      if (!found) {
        for (const path of pageInfo.paths) {
          try {
            await humanDelay(1000, 2000);
            await page.goto(`${config.baseUrl}${path}`);
            await page.waitForLoadState('networkidle');
            await humanDelay(2000, 4000);
            await detectCaptcha();
            await detectRateLimit();
            await capturePageAnalysis(page, `04-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}`);
            found = true;
            break;
          } catch (e) {
            continue;
          }
        }
      }

      if (!found) {
        console.log(`  ⚠ Could not find: ${pageInfo.name}`);
      }
    }

    // 4. Generate comprehensive report
    console.log('\n📊 Generating comprehensive analysis report...');
    const reportPath = path.join(REPORTS_DIR, 'full-analysis.json');
    await fs.writeFile(reportPath, JSON.stringify(allAnalysis, null, 2));
    console.log(`  ✓ Full report saved: ${reportPath}`);

    // 5. Generate human-readable summary
    const summaryPath = path.join(REPORTS_DIR, 'SUMMARY.md');
    let summary = `# Huntr.co Analysis Report\n\n`;
    summary += `**Generated**: ${new Date().toISOString()}\n\n`;
    summary += `## Analysis Complete\n\n`;
    summary += `All screenshots and detailed JSON reports have been saved to:\n`;
    summary += `- Screenshots: \`${SCREENSHOTS_DIR}\`\n`;
    summary += `- Reports: \`${REPORTS_DIR}\`\n\n`;
    summary += `## Next Steps\n\n`;
    summary += `1. Review screenshots to understand UI layout\n`;
    summary += `2. Review JSON reports for detailed element analysis\n`;
    summary += `3. Use findings to refactor the clone application\n`;

    await fs.writeFile(summaryPath, summary);
    console.log(`  ✓ Summary saved: ${summaryPath}`);

    console.log('\n✅ Analysis Complete!\n');
    console.log(`📁 Results saved in: ${ANALYSIS_DIR}`);

  } catch (error) {
    console.error('\n❌ Error during analysis:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error.png') });
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  console.log('🔍 Huntr.co Automated Analysis Tool\n');

  // Check for credentials from environment or arguments
  const email = process.env.HUNTR_EMAIL || process.argv[2];
  const password = process.env.HUNTR_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('❌ Error: Credentials required\n');
    console.log('Usage:');
    console.log('  node analyze-huntr.js <email> <password>');
    console.log('  or set HUNTR_EMAIL and HUNTR_PASSWORD environment variables\n');
    process.exit(1);
  }

  await setupDirectories();
  await analyzeHuntr({ email, password });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeHuntr, capturePageAnalysis };
