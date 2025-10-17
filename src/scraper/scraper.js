import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

/**
 * Web Scraper Module
 * Supports static and dynamic scraping with extensibility
 */
export class WebScraper {
  constructor() {
    this.browser = null;
    this.plugins = new Map();
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      logger.info('Scraper: Initializing browser...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Static HTML scraping using axios + cheerio
   * @param {string} url - Target URL
   * @param {object} selectors - CSS selectors to extract data
   */
  async scrapeStatic(url, selectors = {}) {
    try {
      logger.info(`Scraper: Static scraping ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const results = {};

      for (const [key, selector] of Object.entries(selectors)) {
        results[key] = $(selector).map((i, el) => $(el).text().trim()).get();
      }

      logger.info('Scraper: Static scraping complete');
      return {
        url,
        method: 'static',
        data: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Scraper: Static scraping failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Dynamic scraping using Puppeteer for JavaScript-heavy sites
   * @param {string} url - Target URL
   * @param {object} options - Scraping options
   */
  async scrapeDynamic(url, options = {}) {
    try {
      logger.info(`Scraper: Dynamic scraping ${url}`);

      await this.initBrowser();
      const page = await this.browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      await page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: options.timeout || 30000
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector);
      }

      // Execute custom actions if provided
      if (options.actions) {
        for (const action of options.actions) {
          await this.executeAction(page, action);
        }
      }

      // Extract data
      const data = await page.evaluate((selectors) => {
        const results = {};
        for (const [key, selector] of Object.entries(selectors || {})) {
          const elements = document.querySelectorAll(selector);
          results[key] = Array.from(elements).map(el => el.textContent.trim());
        }
        return results;
      }, options.selectors || {});

      // Screenshot if requested
      if (options.screenshot) {
        await page.screenshot({ path: options.screenshot });
      }

      await page.close();

      logger.info('Scraper: Dynamic scraping complete');
      return {
        url,
        method: 'dynamic',
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Scraper: Dynamic scraping failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute page action (click, type, etc.)
   */
  async executeAction(page, action) {
    switch (action.type) {
      case 'click':
        await page.click(action.selector);
        break;
      case 'type':
        await page.type(action.selector, action.text);
        break;
      case 'wait':
        await page.waitForTimeout(action.duration);
        break;
      case 'scroll':
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
      default:
        logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Register a scraping plugin
   * @param {string} name - Plugin name
   * @param {function} handler - Plugin handler function
   */
  registerPlugin(name, handler) {
    logger.info(`Scraper: Registering plugin '${name}'`);
    this.plugins.set(name, handler);
  }

  /**
   * Execute a registered plugin
   * @param {string} name - Plugin name
   * @param {object} context - Plugin context
   */
  async executePlugin(name, context) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin '${name}' not found`);
    }

    logger.info(`Scraper: Executing plugin '${name}'`);
    return await plugin(context, this);
  }

  /**
   * Batch scraping multiple URLs
   * @param {array} urls - Array of URLs to scrape
   * @param {object} options - Scraping options
   */
  async scrapeBatch(urls, options = {}) {
    logger.info(`Scraper: Batch scraping ${urls.length} URLs`);

    const results = [];
    const method = options.dynamic ? 'scrapeDynamic' : 'scrapeStatic';

    for (const url of urls) {
      try {
        const result = await this[method](url, options);
        results.push(result);

        // Rate limiting
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
      } catch (error) {
        results.push({
          url,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return results;
  }

  /**
   * Close browser and cleanup
   */
  async cleanup() {
    if (this.browser) {
      logger.info('Scraper: Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
