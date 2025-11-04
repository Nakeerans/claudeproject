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

test.describe('Huntr.co Profile Builder - All Tabs', () => {
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

  test('Explore all Profile Builder tabs', async ({ page }) => {
    // All Profile Builder tab URLs
    const profileBuilderTabs = [
      { name: 'Basic Info', url: '/track/profile/builder/basic-info' },
      { name: 'Education', url: '/track/profile/builder/education' },
      { name: 'Work Experience', url: '/track/profile/builder/work-experience' },
      { name: 'Volunteer Experience', url: '/track/profile/builder/volunteer-experience' },
      { name: 'Skills', url: '/track/profile/builder/skills' },
      { name: 'Certifications', url: '/track/profile/builder/certifications' },
      { name: 'Projects', url: '/track/profile/builder/projects' },
      { name: 'Publications', url: '/track/profile/builder/publications' },
      { name: 'Languages', url: '/track/profile/builder/languages' },
      { name: 'Awards', url: '/track/profile/builder/awards' },
      { name: 'References', url: '/track/profile/builder/references' },
      { name: 'Custom Sections', url: '/track/profile/builder/custom-sections' },
    ];

    const results = [];

    for (const tab of profileBuilderTabs) {
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
      path.join(RESULTS_DIR, 'profile-builder-tabs-results.json'),
      JSON.stringify(results, null, 2)
    );

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n✅ Completed: ${successCount}/${results.length} Profile Builder tabs`);
  });

  test('Explore Resume Builder tabs', async ({ page }) => {
    // Resume Builder tabs
    const resumeBuilderTabs = [
      { name: 'Base Resumes', url: '/track/resume-builder/home/base' },
      { name: 'Tailored Resumes', url: '/track/resume-builder/home/tailored' },
      { name: 'Templates', url: '/track/resume-builder/templates' },
    ];

    for (const tab of resumeBuilderTabs) {
      try {
        await page.goto(`https://huntr.co${tab.url}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await capturePageState(page, `Resume_Builder_${tab.name}`);
      } catch (error: any) {
        console.log(`✗ Failed to capture ${tab.name}: ${error.message}`);
      }
    }
  });

  test('Explore AI Tools tabs', async ({ page }) => {
    // AI Tools tabs
    const aiToolsTabs = [
      { name: 'Cover Letters', url: '/track/ai-tools/cover-letters' },
      { name: 'Job Match', url: '/track/ai-tools/job-match' },
      { name: 'Interview Prep', url: '/track/ai-tools/interview-prep' },
      { name: 'Resume Review', url: '/track/ai-resume-review' },
    ];

    for (const tab of aiToolsTabs) {
      try {
        await page.goto(`https://huntr.co${tab.url}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await capturePageState(page, `AI_Tools_${tab.name}`);
      } catch (error: any) {
        console.log(`ℹ Skipping ${tab.name}: ${error.message}`);
      }
    }
  });

  test('Explore Settings tabs', async ({ page }) => {
    // Settings tabs/sections
    const settingsSections = [
      { name: 'General Settings', url: '/track/settings' },
      { name: 'Account', url: '/track/settings/account' },
      { name: 'Integrations', url: '/track/settings/integrations' },
      { name: 'Notifications', url: '/track/settings/notifications' },
      { name: 'Privacy', url: '/track/settings/privacy' },
      { name: 'Billing', url: '/track/settings/billing' },
    ];

    for (const section of settingsSections) {
      try {
        await page.goto(`https://huntr.co${section.url}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await capturePageState(page, `Settings_${section.name}`);
      } catch (error: any) {
        console.log(`ℹ Skipping ${section.name}: ${error.message}`);
      }
    }
  });
});
