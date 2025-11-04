import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginToHuntr, getBoardId } from './auth-helper.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, 'results');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');
const HTML_DIR = path.join(RESULTS_DIR, 'html');

test.beforeAll(async () => {
  // Create results directories
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(HTML_DIR, { recursive: true });
});

test.describe('Huntr.co Basic Navigation', () => {
  let boardId: string;

  test.beforeEach(async ({ page }) => {
    // Login before each test (loads credentials from .credentials file)
    await loginToHuntr(page);

    // Get board ID from credentials file
    boardId = await getBoardId();
  });

  async function capturePageState(page: any, pageName: string) {
    const timestamp = Date.now();
    const safePageName = pageName.replace(/[^a-z0-9]/gi, '_');

    // Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${timestamp}-${safePageName}.png`),
      fullPage: true
    });

    // HTML
    const html = await page.content();
    await fs.writeFile(
      path.join(HTML_DIR, `${timestamp}-${safePageName}.html`),
      html
    );

    const url = page.url();
    console.log(`✓ Captured: ${pageName} (${url})`);

    return { url, timestamp };
  }

  test('Explore all main pages', async ({ page }) => {
    const pages = [
      { name: 'Application Hub', url: '/track/application-hub' },
      { name: 'Resume Builder', url: '/track/resume-builder/home/base' },
      { name: 'AI Resume Review', url: '/track/ai-resume-review' },
      { name: 'AI Tools', url: '/track/ai-tools/cover-letters' },
      { name: 'Autofill Applications', url: '/track/autofill-applications' },
      { name: 'Job Board - Main', url: `/track/boards/${boardId}/board` },
      { name: 'Job Board - Activities', url: `/track/boards/${boardId}/activities` },
      { name: 'Job Board - Contacts', url: `/track/boards/${boardId}/contacts` },
      { name: 'Job Board - Documents', url: `/track/boards/${boardId}/documents` },
      { name: 'Job Board - Map', url: `/track/boards/${boardId}/map` },
      { name: 'Job Board - Metrics', url: `/track/boards/${boardId}/metrics` },
      { name: 'Settings', url: '/track/settings' },
      { name: 'Profile', url: '/track/profile' },
      { name: 'Profile - Builder', url: '/track/profile/builder' },
      { name: 'Profile - Preview', url: '/track/profile/preview' },
    ];

    const results = [];

    for (const pageInfo of pages) {
      try {
        await page.goto(`https://huntr.co${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded'); // Faster than networkidle
        await page.waitForTimeout(2000); // Let page settle and dynamic content load

        const result = await capturePageState(page, pageInfo.name);
        results.push({
          name: pageInfo.name,
          url: result.url,
          status: 'success',
          timestamp: result.timestamp
        });
      } catch (error: any) {
        console.log(`✗ Failed to capture ${pageInfo.name}: ${error.message}`);
        results.push({
          name: pageInfo.name,
          url: pageInfo.url,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Save results summary
    await fs.writeFile(
      path.join(RESULTS_DIR, 'navigation-results.json'),
      JSON.stringify(results, null, 2)
    );

    console.log(`\n✅ Completed: ${results.filter(r => r.status === 'success').length}/${results.length} pages`);
  });

  test('Explore Welcome Guide and Onboarding', async ({ page }) => {
    const pages = [
      { name: 'Welcome Guide', url: '/track/welcome-guide' },
      { name: 'Dashboard', url: '/track' },
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(`https://huntr.co${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        await capturePageState(page, pageInfo.name);
      } catch (error: any) {
        console.log(`✗ Failed to capture ${pageInfo.name}: ${error.message}`);
      }
    }
  });

  test('Explore Job Search and Job Tracker', async ({ page }) => {
    const pages = [
      { name: 'Job Search', url: '/track/job-search' },
      { name: 'Job Tracker', url: '/track/job-tracker' },
      { name: 'Job Match', url: '/track/job-match' },
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(`https://huntr.co${pageInfo.url}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
        await capturePageState(page, pageInfo.name);
      } catch (error: any) {
        // Some pages might not exist, continue
        console.log(`ℹ Skipping ${pageInfo.name}: ${error.message}`);
      }
    }
  });
});
