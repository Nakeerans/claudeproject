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

test.describe('Huntr.co Modal Discovery', () => {
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

  test('Discover creation modals on Application Hub', async ({ page }) => {
    await page.goto('https://huntr.co/track/application-hub');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Common button texts for creation actions
    const createButtonTexts = [
      'Add Job',
      'Add Application',
      'New Job',
      'New Application',
      'Create',
      'Add',
      'New',
      '+ Job',
      '+ Application'
    ];

    let modalsFound = 0;

    for (const buttonText of createButtonTexts) {
      try {
        const button = await page.$(`button:has-text("${buttonText}")`);
        if (button) {
          console.log(`✓ Found button: "${buttonText}"`);

          await button.click();
          await page.waitForTimeout(1500);

          // Check if modal appeared
          const modal = await page.$('[role="dialog"], [class*="Modal"], [class*="modal"]');
          if (modal) {
            modalsFound++;
            await capturePageState(page, `modal_${buttonText.replace(/[^a-z0-9]/gi, '_')}`);
            console.log(`✓ Captured modal from "${buttonText}"`);

            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          } else {
            console.log(`ℹ Button "${buttonText}" didn't open a modal`);
          }
        }
      } catch (error) {
        // Continue to next button
      }
    }

    console.log(`\nTotal modals found: ${modalsFound}`);
  });

  test('Discover modals on Job Board', async ({ page }) => {
    await page.goto(`https://huntr.co/track/boards/${boardId}/board`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButtonTexts = [
      'Add Job',
      'New Job',
      'Create Job',
      'Add',
      'New',
    ];

    for (const buttonText of createButtonTexts) {
      try {
        const buttons = await page.$$(`button:has-text("${buttonText}"), a:has-text("${buttonText}")`);

        for (let i = 0; i < buttons.length; i++) {
          try {
            await buttons[i].click();
            await page.waitForTimeout(1500);

            const modal = await page.$('[role="dialog"], [class*="Modal"]');
            if (modal) {
              await capturePageState(page, `board_modal_${buttonText.replace(/[^a-z0-9]/gi, '_')}_${i}`);
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            }
          } catch (error) {
            // Continue
          }
        }
      } catch (error) {
        // Continue to next button text
      }
    }
  });

  test('Discover modals on Contacts page', async ({ page }) => {
    await page.goto(`https://huntr.co/track/boards/${boardId}/contacts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButtonTexts = [
      'Add Contact',
      'New Contact',
      'Create Contact',
      'Add',
      'New',
    ];

    for (const buttonText of createButtonTexts) {
      try {
        const button = await page.$(`button:has-text("${buttonText}")`);
        if (button) {
          await button.click();
          await page.waitForTimeout(1500);

          const modal = await page.$('[role="dialog"]');
          if (modal) {
            await capturePageState(page, `contacts_modal_${buttonText.replace(/[^a-z0-9]/gi, '_')}`);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        // Continue
      }
    }
  });

  test('Discover modals on Documents page', async ({ page }) => {
    await page.goto(`https://huntr.co/track/boards/${boardId}/documents`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createButtonTexts = [
      'Upload',
      'Add Document',
      'New Document',
      'Upload Document',
      'Add',
      'New',
    ];

    for (const buttonText of createButtonTexts) {
      try {
        const button = await page.$(`button:has-text("${buttonText}")`);
        if (button) {
          await button.click();
          await page.waitForTimeout(1500);

          const modal = await page.$('[role="dialog"]');
          if (modal) {
            await capturePageState(page, `documents_modal_${buttonText.replace(/[^a-z0-9]/gi, '_')}`);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        // Continue
      }
    }
  });

  test('Discover settings modals', async ({ page }) => {
    await page.goto('https://huntr.co/track/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await capturePageState(page, 'settings_main');

    // Look for edit buttons in settings
    const editButtons = await page.$$('button:has-text("Edit"), button:has-text("Change"), button:has-text("Update")');
    console.log(`Found ${editButtons.length} edit/change buttons`);

    for (let i = 0; i < Math.min(5, editButtons.length); i++) {
      try {
        await editButtons[i].click();
        await page.waitForTimeout(1500);

        const modal = await page.$('[role="dialog"]');
        if (modal) {
          await capturePageState(page, `settings_modal_${i}`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      } catch (error) {
        // Continue
      }
    }
  });

  test('Discover floating action buttons', async ({ page }) => {
    const pages = [
      '/track/application-hub',
      `/track/boards/${boardId}/board`,
      '/track/resume-builder/home/base',
    ];

    for (const url of pages) {
      try {
        await page.goto(`https://huntr.co${url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Look for floating action buttons (FAB)
        const fabs = await page.$$('[class*="fab"], [class*="FAB"], [class*="floating"], button[aria-label*="Add"]');
        console.log(`Found ${fabs.length} floating action buttons on ${url}`);

        for (let i = 0; i < fabs.length; i++) {
          try {
            await fabs[i].click();
            await page.waitForTimeout(1500);

            const modal = await page.$('[role="dialog"]');
            if (modal) {
              const pageName = url.split('/').pop() || 'page';
              await capturePageState(page, `fab_modal_${pageName}_${i}`);
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            }
          } catch (error) {
            // Continue
          }
        }
      } catch (error) {
        console.log(`ℹ Skipping ${url}: ${error.message}`);
      }
    }
  });
});
