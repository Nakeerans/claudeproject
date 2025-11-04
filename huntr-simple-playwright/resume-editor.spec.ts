import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginToHuntr } from './auth-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, 'results');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');
const HTML_DIR = path.join(RESULTS_DIR, 'html');

test.describe('Huntr.co Resume Editor Exploration', () => {
  test.beforeEach(async ({ page }) => {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(HTML_DIR, { recursive: true });

    // Login (loads credentials from .credentials file)
    await loginToHuntr(page);
  });

  async function capturePageState(page: any, pageName: string) {
    const timestamp = Date.now();
    const safePageName = pageName.replace(/[^a-z0-9]/gi, '_');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${timestamp}-${safePageName}.png`),
      fullPage: true
    });

    const html = await page.content();
    await fs.writeFile(
      path.join(HTML_DIR, `${timestamp}-${safePageName}.html`),
      html
    );

    console.log(`✓ Captured: ${pageName}`);
  }

  test('Explore resume builder and editor', async ({ page }) => {
    // Navigate to resume builder
    await page.goto('https://huntr.co/track/resume-builder/home/base');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Capture resume list page
    await capturePageState(page, 'resume_builder_home');

    // Try to find resume cards
    const resumeSelectors = [
      '[class*="Resume"]',
      '[class*="resume"]',
      '[data-testid*="resume"]',
      'article',
      '[class*="Card"]',
      'button[class*="resume"]'
    ];

    let resumes = [];
    for (const selector of resumeSelectors) {
      resumes = await page.$$(selector);
      if (resumes.length > 0) {
        console.log(`✓ Found ${resumes.length} resume items using selector: ${selector}`);
        break;
      }
    }

    // If we found resumes, click the first one to open editor
    if (resumes.length > 0) {
      try {
        await resumes[0].click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await capturePageState(page, 'resume_editor_main');

        // Look for tabs in the editor
        const tabs = await page.$$('[role="tab"]');
        console.log(`\nFound ${tabs.length} tabs in resume editor`);

        for (let i = 0; i < tabs.length; i++) {
          try {
            await tabs[i].click();
            await page.waitForTimeout(1500);

            const tabText = await tabs[i].textContent();
            const tabName = tabText?.trim().replace(/\s+/g, '_') || `tab_${i + 1}`;

            await capturePageState(page, `resume_editor_${tabName}`);
            console.log(`✓ Explored tab: ${tabText}`);
          } catch (error) {
            console.log(`✗ Failed to explore tab ${i + 1}: ${error.message}`);
          }
        }

        // Look for sections/panels in the editor
        const sections = await page.$$('[class*="Section"], [class*="Panel"]');
        console.log(`Found ${sections.length} sections/panels`);

      } catch (error) {
        console.log(`✗ Failed to open resume editor: ${error.message}`);
      }
    } else {
      console.log('⚠ No resumes found. User might need to create a resume first.');
    }
  });

  test('Explore resume templates', async ({ page }) => {
    const templatePages = [
      '/track/resume-builder/templates',
      '/track/resume-builder/home/templates',
      '/track/resume-builder/create'
    ];

    for (const url of templatePages) {
      try {
        await page.goto(`https://huntr.co${url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const pageName = url.split('/').pop() || 'templates';
        await capturePageState(page, `resume_${pageName}`);
      } catch (error) {
        console.log(`ℹ Skipping ${url}: page might not exist`);
      }
    }
  });

  test('Explore AI resume review', async ({ page }) => {
    await page.goto('https://huntr.co/track/ai-resume-review');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await capturePageState(page, 'ai_resume_review');

    // Try to find upload button or resume selection
    const uploadButtons = await page.$$('button:has-text("Upload"), button:has-text("Select"), input[type="file"]');
    console.log(`Found ${uploadButtons.length} upload/select elements`);

    // Try to find any existing reviews
    const reviews = await page.$$('[class*="Review"], [class*="review"], article');
    if (reviews.length > 0) {
      console.log(`Found ${reviews.length} review items`);

      // Click first review to see details
      try {
        await reviews[0].click();
        await page.waitForTimeout(2000);
        await capturePageState(page, 'ai_resume_review_detail');
      } catch (error) {
        console.log(`ℹ Couldn't open review detail: ${error.message}`);
      }
    }
  });
});
