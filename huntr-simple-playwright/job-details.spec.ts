import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginToHuntr, getBoardId } from './auth-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, 'results');
const SCREENSHOTS_DIR = path.join(RESULTS_DIR, 'screenshots');
const HTML_DIR = path.join(RESULTS_DIR, 'html');

test.describe('Huntr.co Job Details Exploration', () => {
  let boardId: string;

  test.beforeEach(async ({ page }) => {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(HTML_DIR, { recursive: true });

    // Login (loads credentials from .credentials file)
    await loginToHuntr(page);

    boardId = await getBoardId();
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

  test('Explore job application cards and details', async ({ page }) => {
    // Navigate to job board
    await page.goto(`https://huntr.co/track/boards/${boardId}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try multiple selectors to find job cards
    const cardSelectors = [
      '[class*="JobCard"]',
      '[class*="job-card"]',
      '[data-testid*="job"]',
      '[class*="Card"]',
      'article',
      '[role="article"]',
      'div[draggable="true"]', // Job cards are often draggable
    ];

    let jobCards = [];
    for (const selector of cardSelectors) {
      jobCards = await page.$$(selector);
      if (jobCards.length > 0) {
        console.log(`✓ Found ${jobCards.length} cards using selector: ${selector}`);
        break;
      }
    }

    if (jobCards.length === 0) {
      console.log('⚠ No job cards found. Trying to find any clickable elements...');
      // Fallback: look for any clickable elements in the main content
      jobCards = await page.$$('main a, main button, main [onclick]');
      console.log(`Found ${jobCards.length} clickable elements`);
    }

    // Click into first 5 job cards to see detail views
    const maxCards = Math.min(5, jobCards.length);
    console.log(`\nAttempting to explore ${maxCards} job cards...\n`);

    for (let i = 0; i < maxCards; i++) {
      try {
        const currentUrl = page.url();

        // Re-query the element to avoid stale reference
        const cards = await page.$$(cardSelectors[0]);
        if (cards.length <= i) break;

        await cards[i].click();
        await page.waitForTimeout(2000);

        // Check if URL changed (navigated to detail page)
        const newUrl = page.url();
        if (newUrl !== currentUrl) {
          await capturePageState(page, `job_detail_${i + 1}`);

          // Go back to board
          await page.goBack();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        } else {
          // Maybe opened a modal instead?
          const modal = await page.$('[role="dialog"], [class*="Modal"]');
          if (modal) {
            await capturePageState(page, `job_modal_${i + 1}`);
            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          } else {
            console.log(`ℹ Card ${i + 1} click didn't navigate or open modal`);
          }
        }
      } catch (error) {
        console.log(`✗ Failed to explore job card ${i + 1}: ${error.message}`);
      }
    }
  });

  test('Explore different job board columns', async ({ page }) => {
    await page.goto(`https://huntr.co/track/boards/${boardId}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find columns (Wishlist, Applied, Interview, Offer, etc.)
    const columns = await page.$$('[class*="Column"], [class*="column"], [data-testid*="column"]');
    console.log(`Found ${columns.length} columns`);

    for (let i = 0; i < columns.length; i++) {
      try {
        const columnHeader = await columns[i].$('h2, h3, [class*="header"]');
        const columnName = columnHeader ? await columnHeader.textContent() : `column_${i + 1}`;

        // Find cards in this column
        const cardsInColumn = await columns[i].$$('[draggable="true"], [class*="Card"]');
        console.log(`Column "${columnName}": ${cardsInColumn.length} cards`);

        if (cardsInColumn.length > 0) {
          // Click first card in column
          await cardsInColumn[0].click();
          await page.waitForTimeout(2000);

          const modal = await page.$('[role="dialog"]');
          if (modal) {
            await capturePageState(page, `${columnName?.replace(/\s+/g, '_')}_card_detail`);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        console.log(`✗ Failed to explore column ${i + 1}: ${error.message}`);
      }
    }
  });
});
