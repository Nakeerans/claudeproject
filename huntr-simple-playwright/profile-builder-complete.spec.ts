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

test.describe('Huntr.co Profile Builder - Complete Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
    await fs.mkdir(HTML_DIR, { recursive: true });

    // Login
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

    const url = page.url();
    console.log(`✓ Captured: ${pageName} (${url})`);
  }

  test('Capture ALL Profile Builder sub-tabs including missing ones', async ({ page }) => {
    // Complete list of ALL Profile Builder sub-tabs from the screenshot
    const profileBuilderSubTabs = [
      { name: 'Basic Info', url: '/track/profile/builder/basic-info' },
      { name: 'Preferences', url: '/track/profile/builder/preferences' },
      { name: 'Experience', url: '/track/profile/builder/experience' },
      { name: 'Volunteer Experience', url: '/track/profile/builder/volunteer-experience' },
      { name: 'Certifications', url: '/track/profile/builder/certifications' },
      { name: 'Education', url: '/track/profile/builder/education' },
      { name: 'Projects', url: '/track/profile/builder/projects' },
      { name: 'Links', url: '/track/profile/builder/links' },
      { name: 'Documents', url: '/track/profile/builder/documents' },
      { name: 'Custom Fields', url: '/track/profile/builder/custom-fields' },
      { name: 'Autofill Fields', url: '/track/profile/builder/autofill-fields' },

      // Additional tabs that might exist
      { name: 'Skills', url: '/track/profile/builder/skills' },
      { name: 'Languages', url: '/track/profile/builder/languages' },
      { name: 'Awards', url: '/track/profile/builder/awards' },
      { name: 'Publications', url: '/track/profile/builder/publications' },
      { name: 'References', url: '/track/profile/builder/references' },
      { name: 'Custom Sections', url: '/track/profile/builder/custom-sections' },
    ];

    const results = [];

    for (const tab of profileBuilderSubTabs) {
      try {
        await page.goto(`https://huntr.co${tab.url}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Let page settle

        await capturePageState(page, `Profile_Builder_${tab.name}`);
        results.push({
          name: tab.name,
          url: tab.url,
          status: 'success'
        });
      } catch (error: any) {
        console.log(`✗ Failed to capture ${tab.name}: ${error.message}`);
        results.push({
          name: tab.name,
          url: tab.url,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Save results summary
    await fs.writeFile(
      path.join(RESULTS_DIR, 'profile-builder-complete-results.json'),
      JSON.stringify(results, null, 2)
    );

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n✅ Completed: ${successCount}/${results.length} Profile Builder sub-tabs`);

    // Show which ones were captured
    console.log(`\n📊 Breakdown:`);
    results.forEach(r => {
      const icon = r.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${r.name}`);
    });
  });
});
