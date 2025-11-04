import { Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load credentials from .credentials file (same method as AI-guided analyzer)
 */
async function loadCredentials() {
  const credentialsPath = path.join(__dirname, '../.credentials');
  try {
    const content = await fs.readFile(credentialsPath, 'utf-8');
    const credentials: Record<string, string> = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          credentials[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return credentials;
  } catch (error) {
    console.error('❌ Error reading .credentials file:', error);
    throw error;
  }
}

// Cache credentials to avoid reading file multiple times
let cachedCredentials: Record<string, string> | null = null;

/**
 * Login helper - uses the working implementation from ai-guided-huntr-analyzer.js
 */
export async function loginToHuntr(page: Page) {
  console.log('🔐 Logging in to Huntr.co...');

  // Load credentials if not cached
  if (!cachedCredentials) {
    cachedCredentials = await loadCredentials();
  }

  const email = cachedCredentials.HUNTR_EMAIL;
  const password = cachedCredentials.HUNTR_PASSWORD;

  if (!email || !password) {
    throw new Error('HUNTR_EMAIL or HUNTR_PASSWORD not found in .credentials file');
  }

  // Navigate to login page
  await page.goto('https://huntr.co/login');
  await page.waitForTimeout(2000);

  // Wait for login form to appear
  console.log('  → Waiting for login form...');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Fill email
  console.log('  → Entering email...');
  const emailField = page.locator('input[type="email"], input[name="email"]').first();
  await emailField.click();
  await emailField.fill(email);
  await page.waitForTimeout(500);

  // Fill password
  console.log('  → Entering password...');
  const passwordField = page.locator('input[type="password"], input[name="password"]').first();
  await passwordField.click();
  await passwordField.fill(password);
  await page.waitForTimeout(1000);

  // Submit form
  console.log('  → Submitting login form...');
  const submitBtn = page.locator('button:has-text("Log In"), button:has-text("Log in"), button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('  ✓ Login successful!');
}

/**
 * Get board ID from credentials file
 */
export async function getBoardId(): Promise<string> {
  if (!cachedCredentials) {
    cachedCredentials = await loadCredentials();
  }
  return cachedCredentials.HUNTR_BOARD_ID || '68f1297b730de1007a3642b9';
}
