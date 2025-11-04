import { defineConfig, devices } from '@playwright/test';

// Playwright config specifically for Huntr.co live site testing
// No web server needed - we test against https://huntr.co

export default defineConfig({
  testDir: '.',
  timeout: 600000, // 10 minutes per test (15 pages * ~30s each)
  fullyParallel: false, // Run tests sequentially to avoid rate limiting
  retries: 0, // Don't retry to save time
  workers: 1, // One worker to avoid multiple simultaneous logins

  reporter: [
    ['list'],
    ['json', { outputFile: 'results/test-results.json' }],
  ],

  use: {
    // Test against live Huntr.co site
    baseURL: 'https://huntr.co',

    // Browser settings
    headless: false, // Run in headed mode to see what's happening
    screenshot: 'on',
    video: 'off',
    trace: 'retain-on-failure',

    // Increased timeouts for slow-loading pages
    actionTimeout: 30000, // 30 seconds for actions
    navigationTimeout: 60000, // 60 seconds for page loads
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  // No web server - testing live site
});
