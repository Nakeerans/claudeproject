#!/usr/bin/env node

/**
 * AI-Guided Simplify.jobs Analyzer
 *
 * Learns and explores the Simplify.jobs platform using AI guidance
 * Based on the successful Huntr analyzer pattern
 */

import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONFIGURATION ====================

const CONFIG = {
  BASE_URL: 'https://simplify.jobs',
  LOGIN_URL: 'https://simplify.jobs/auth/login',
  HEADLESS: false,
  VIEWPORT: { width: 1920, height: 1080 },
  MAX_ITERATIONS: 20,
  MAX_DEPTH: 3,
  TIMEOUT: 60000,
  SMART_FILTERING: true,
  CLAUDE_MODEL: 'claude-3-5-haiku-20241022',
  ANALYSIS_DIR: path.join(__dirname, 'simplify-analysis'),
  SCREENSHOTS_DIR: path.join(__dirname, 'simplify-analysis', 'screenshots'),
  HTML_DIR: path.join(__dirname, 'simplify-analysis', 'html'),
  ELEMENTS_DIR: path.join(__dirname, 'simplify-analysis', 'elements'),
  COMPONENTS_DIR: path.join(__dirname, 'simplify-analysis', 'components')
};

// ==================== AI CLIENT ====================

let anthropic; // Will be initialized after loading credentials

// ==================== STATE MANAGEMENT ====================

const state = {
  visitedPages: new Set(),
  pagesDatabase: new Map(),
  elementsDatabase: new Map(),
  currentDepth: 0,
  iterationCount: 0,
  startTime: Date.now(),
  aiDecisions: [],
  featureInventory: new Map(),
  executionErrors: [],
  failedActions: new Map(), // Track failed navigation attempts
  conversationHistory: [], // Persistent AI conversation
  pageContents: new Map(), // Store HTML content for AI analysis
  currentPageExplorationCount: 0, // Track iterations on current page
  currentPageSuccessCount: 0, // Track SUCCESSFUL interactions only
  lastPageUrl: '', // Track page changes
  pageExplorationPhase: 'explore', // 'explore' or 'navigate'
  exploredPages: new Map() // Track how thoroughly each page was explored
};

// ==================== UTILITIES ====================

async function ensureDirectories() {
  await fs.mkdir(CONFIG.ANALYSIS_DIR, { recursive: true });
  await fs.mkdir(CONFIG.SCREENSHOTS_DIR, { recursive: true });
  await fs.mkdir(CONFIG.HTML_DIR, { recursive: true });
  await fs.mkdir(CONFIG.ELEMENTS_DIR, { recursive: true });
  await fs.mkdir(CONFIG.COMPONENTS_DIR, { recursive: true });
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '📘',
    SUCCESS: '✅',
    ERROR: '❌',
    AI: '🤖',
    ACTION: '🎯',
    DISCOVERY: '🔍'
  }[type] || '📘';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function saveState(filename, data) {
  const filepath = path.join(CONFIG.ANALYSIS_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  log(`Saved: ${filename}`, 'SUCCESS');
}

// ==================== PAGE CAPTURE ====================

async function capturePage(page, pageName) {
  const timestamp = Date.now();
  const safeName = pageName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

  try {
    // Screenshot
    await page.screenshot({
      path: path.join(CONFIG.SCREENSHOTS_DIR, `${timestamp}-${safeName}.png`),
      fullPage: true
    });

    // HTML
    const html = await page.content();
    await fs.writeFile(
      path.join(CONFIG.HTML_DIR, `${timestamp}-${safeName}.html`),
      html
    );

    // URL
    const url = page.url();

    log(`Captured: ${pageName} (${url})`, 'SUCCESS');

    return { timestamp, url, name: pageName };
  } catch (error) {
    log(`Failed to capture ${pageName}: ${error.message}`, 'ERROR');
    return null;
  }
}

// ==================== ELEMENT EXTRACTION ====================

async function extractInteractiveElements(page) {
  return await page.evaluate(() => {
    const elements = [];
    let id = 0;

    // Define selectors for Simplify.jobs
    const selectors = [
      // Navigation
      'a[href]',
      'button',
      // Dashboard elements
      '[role="button"]',
      '[role="tab"]',
      '[role="menuitem"]',
      // Job-specific
      '.job-card',
      '.application-card',
      '.company-card',
      // Forms
      'input[type="submit"]',
      'input[type="button"]',
      // Dropdowns/Selects
      'select',
      '[role="combobox"]',
      // Interactive divs
      'div[onclick]',
      'div[role="link"]'
    ];

    function getElementInfo(el) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      // Check visibility
      if (rect.width === 0 || rect.height === 0 ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0') {
        return null;
      }

      // Get text content
      const text = (el.textContent || el.innerText || '').trim().substring(0, 100);
      const ariaLabel = el.getAttribute('aria-label') || '';
      const title = el.getAttribute('title') || '';
      const label = text || ariaLabel || title || el.tagName;

      return {
        id: id++,
        tag: el.tagName.toLowerCase(),
        type: el.type || el.getAttribute('role') || '',
        label: label,
        href: el.href || el.getAttribute('href') || '',
        className: el.className?.toString() || '',
        visible: rect.top >= -100 && rect.top <= window.innerHeight + 100,
        position: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        }
      };
    }

    // Extract all matching elements
    selectors.forEach(selector => {
      try {
        const elems = document.querySelectorAll(selector);
        elems.forEach(el => {
          const info = getElementInfo(el);
          if (info && info.label) {
            elements.push(info);
          }
        });
      } catch (e) {
        console.error(`Error with selector ${selector}:`, e);
      }
    });

    // Deduplicate by label and position
    const unique = [];
    const seen = new Set();

    elements.forEach(el => {
      const key = `${el.label}-${el.position.x}-${el.position.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(el);
      }
    });

    return unique;
  });
}

// ==================== SMART FILTERING ====================

function filterRelevantElements(elements, currentPage) {
  if (!CONFIG.SMART_FILTERING) return elements;

  const filtered = elements.filter(el => {
    // Skip if not visible
    if (!el.visible) return false;

    // Skip common navigation we've already explored
    const label = el.label.toLowerCase().trim();

    // ABSOLUTE BLOCKS - Never click these
    const absoluteSkipPatterns = [
      'logout', 'log out', 'sign out',
      'privacy', 'terms', 'cookie',
      'facebook', 'twitter', 'linkedin', 'instagram',
      'download app', 'mobile app',
      'chrome', 'extension', 'browser',  // Skip external browser extension links
      'feedback', 'help', 'notification',  // Skip feedback, help, and notification buttons
      'jobs', 'matches'  // Skip main navigation when already on those pages
    ];

    if (absoluteSkipPatterns.some(pattern => label.includes(pattern))) {
      return false;
    }

    // STRICT SKIP: External links (anything not on simplify.jobs domain)
    if (el.href && !el.href.includes('simplify.jobs') && (el.href.startsWith('http://') || el.href.startsWith('https://'))) {
      return false;
    }

    // STRICT SKIP: Notification, Matches buttons (exact matches or contains)
    if (label.includes('notification') || label === 'notifications' || label === 'matches') {
      return false;
    }

    // STRICT SKIP: Financial transaction buttons
    const financialPatterns = ['buy', 'purchase', 'subscribe', 'subscription', 'payment',
                               'billing', 'upgrade', 'pro plan', 'premium', 'checkout',
                               'pay now', 'add card', 'credit card', 'pricing', 'start trial'];
    if (financialPatterns.some(pattern => label.includes(pattern))) {
      return false;
    }

    // Skip main navigation links if we're already on that page
    const currentPath = currentPage.url.toLowerCase();
    const navSkipPatterns = [
      { keywords: ['dashboard'], path: '/dashboard' },
      { keywords: ['job tracker'], path: '/dashboard' },
      { keywords: ['jobs'], path: '/jobs' },  // Will match "Jobs", "jobs", etc.
      { keywords: ['profile'], path: '/profile' },
      { keywords: ['settings'], path: '/settings' },
      { keywords: ['companies'], path: '/companies' },
      { keywords: ['applications'], path: '/applications' },
      { keywords: ['tracker'], path: '/tracker' },
      { keywords: ['documents', 'document'], path: '/documents' }
    ];

    for (const nav of navSkipPatterns) {
      // Check if label matches any keyword AND we're on that page
      const matchesKeyword = nav.keywords.some(keyword =>
        label === keyword || label.startsWith(keyword + ' ') || label.endsWith(' ' + keyword)
      );

      if (matchesKeyword && currentPath.includes(nav.path)) {
        return false; // Skip self-navigation (e.g., "Jobs" link when already on /jobs)
      }
    }

    // Prioritize Simplify-specific features AND allow main navigation links
    const priorityPatterns = [
      'application', 'apply',
      'resume', 'document',
      'autofill', 'quick apply',
      'ai', 'copilot', 'search', 'filter',
      'saved', 'save', 'edit', 'add', 'create',
      'more', 'view', 'show', 'preferences',
      'preview', 'download', 'upload', 'change'
    ];

    // Also allow main navigation links (dashboard, jobs, profile, settings, etc.)
    const navPatterns = ['dashboard', 'jobs', 'profile', 'settings', 'companies', 'applications', 'tracker', 'documents'];

    const matchesPriority = priorityPatterns.some(pattern => label.includes(pattern));
    const matchesNav = navPatterns.some(pattern => label.toLowerCase() === pattern);

    return matchesPriority || matchesNav;
  });

  // Sort by priority
  return filtered.sort((a, b) => {
    const aPriority = a.label.toLowerCase();
    const bPriority = b.label.toLowerCase();

    const highPriority = ['dashboard', 'jobs', 'applications', 'resume'];
    const aScore = highPriority.findIndex(p => aPriority.includes(p));
    const bScore = highPriority.findIndex(p => bPriority.includes(p));

    if (aScore !== -1 && bScore !== -1) return aScore - bScore;
    if (aScore !== -1) return -1;
    if (bScore !== -1) return 1;
    return 0;
  });
}

// ==================== AI DECISION MAKING WITH CONVERSATION ====================

async function getAIDecision(elements, currentPage, pageHtml) {
  // Build failed actions summary
  const failedActionsText = Array.from(state.failedActions.entries())
    .map(([label, count]) => `- "${label}" failed ${count} times`)
    .join('\n');

  // Determine exploration phase
  const currentPageBase = currentPage.url.split('?')[0]; // Remove query params
  const pageChanged = state.lastPageUrl !== currentPageBase;

  if (pageChanged) {
    state.currentPageExplorationCount = 0;
    state.currentPageSuccessCount = 0; // Reset success counter on page change
    state.lastPageUrl = currentPageBase;
    state.pageExplorationPhase = 'explore';

    // Initialize page exploration tracking if not exists
    if (!state.exploredPages.has(currentPageBase)) {
      state.exploredPages.set(currentPageBase, {
        iterationCount: 0,
        successCount: 0,
        featuresFound: 0,
        fullyExplored: false
      });
    }
  } else {
    state.currentPageExplorationCount++;

    // Update page exploration data
    const pageData = state.exploredPages.get(currentPageBase);
    if (pageData) {
      pageData.iterationCount++;
    }
  }

  // Switch to navigation phase after SUCCESSFUL explorations
  const MIN_EXPLORATIONS_PER_PAGE = 5;
  if (state.currentPageSuccessCount >= MIN_EXPLORATIONS_PER_PAGE) {
    state.pageExplorationPhase = 'navigate';

    // Mark current page as fully explored
    const pageData = state.exploredPages.get(currentPageBase);
    if (pageData) {
      pageData.fullyExplored = true;
      pageData.successCount = state.currentPageSuccessCount;
    }
  }

  // Get unexplored pages (excluding fully explored ones)
  const allKnownPages = ['/dashboard', '/jobs', '/profile', '/settings', '/companies', '/applications', '/tracker'];
  const visitedBaseUrls = Array.from(state.visitedPages).map(url => url.split('?')[0]);
  const fullyExploredPages = Array.from(state.exploredPages.entries())
    .filter(([url, data]) => data.fullyExplored)
    .map(([url, data]) => url);

  const unexploredPages = allKnownPages.filter(page =>
    !visitedBaseUrls.some(visited => visited.includes(page)) &&
    !fullyExploredPages.some(explored => explored.includes(page))
  );

  // Initial system message for first iteration
  if (state.conversationHistory.length === 0) {
    state.conversationHistory.push({
      role: 'user',
      content: `You are an AI assistant helping to explore and comprehensively analyze the Simplify.jobs job application platform to enable CLONING of the entire application.

YOUR MISSION:
Use a DEPTH-FIRST exploration strategy to discover ALL features with enough detail to recreate/clone the platform.

EXPLORATION STRATEGY (CRITICAL):
1. **DEPTH-FIRST**: When you arrive at a new page, spend 5-7 iterations exploring IN-PAGE features:
   - Click cards, widgets, tabs, and sections
   - Open modals, dialogs, and dropdowns
   - Discover features WITHIN the page before moving to another page
   - Analyze the HTML structure provided (headings, buttons, forms, cards, modals, data attributes)

2. **COMPREHENSIVE ANALYSIS**: For each page, you'll receive detailed HTML analysis including:
   - All headings and page sections
   - Navigation links and their destinations
   - All buttons with their text and attributes
   - Forms with input fields
   - Card/widget components with preview text
   - Modals and dialogs
   - Hidden/disabled elements that may unlock with premium features
   - Data attributes that indicate functionality

3. **FEATURE DISCOVERY**: When you discover a feature, describe it in detail for cloning:
   - What the feature does (functionality)
   - What UI components are involved (buttons, forms, cards, etc.)
   - What data it displays or collects
   - Whether it's a free or premium feature
   - How it integrates with other features

4. **THEN NAVIGATE**: After thoroughly exploring a page (${MIN_EXPLORATIONS_PER_PAGE} iterations), move to the next unexplored page:
   - Dashboard (Job Tracker)
   - Jobs (Job Board)
   - Profile
   - Settings
   - Companies
   - Applications
   - Tracker

5. **AVOID WASTEFUL NAVIGATION**:
   - DON'T navigate to FULLY EXPLORED pages (marked after ${MIN_EXPLORATIONS_PER_PAGE} iterations)
   - DON'T revisit pages you've already thoroughly analyzed
   - DON'T keep clicking navigation links to the same page
   - STAY on each page to discover its features before moving on
   - Learn from failed actions (modals/dialogs that don't navigate)

6. **TRACK PROGRESS**:
   - Remember which pages you've thoroughly explored
   - Remember which elements failed to provide new information
   - Note hidden/disabled features for future exploration

RESPONSE FORMAT:
{
  "action": "click" | "navigate" | "done",
  "element_index": <number>,
  "reasoning": "<your thought process based on HTML analysis>",
  "feature_discovered": "<if you discovered a new feature from the CURRENT page, name it here>",
  "feature_description": "<detailed description including: what it does, UI components involved, data handled, integration points, free vs premium>"
}

Ready to comprehensively analyze for CLONING capability!`
    });

    state.conversationHistory.push({
      role: 'assistant',
      content: `I understand! I will perform COMPREHENSIVE ANALYSIS for cloning capability:

1. **Depth-First Exploration**: 5-7 iterations per page before navigating
2. **HTML Structure Analysis**: I'll examine all headings, buttons, forms, cards, modals, data attributes, and hidden elements
3. **Detailed Feature Discovery**: For each feature I'll document:
   - Functionality and purpose
   - UI components and structure
   - Data inputs/outputs
   - Integration with other features
   - Premium vs free tier
4. **Learn from failures**: Track which elements are modals/dialogs vs navigation
5. **Complete coverage**: Visit all major pages systematically

This will provide enough detail to recreate the entire platform. Let me begin!`
    });
  }

  // Build current iteration message with full context
  const fullyExploredPagesList = fullyExploredPages.length > 0
    ? `\n- Fully Explored Pages (DO NOT revisit): ${fullyExploredPages.map(p => p.split('/').pop()).join(', ')}`
    : '';

  const phaseInstruction = state.pageExplorationPhase === 'explore'
    ? `**CURRENT PHASE: EXPLORING THIS PAGE (${state.currentPageSuccessCount}/${MIN_EXPLORATIONS_PER_PAGE} successful interactions)**
Click IN-PAGE elements (cards, widgets, tabs, buttons) to discover features.
DO NOT navigate to another page yet - explore HERE first!
You need ${MIN_EXPLORATIONS_PER_PAGE - state.currentPageSuccessCount} more SUCCESSFUL interactions before navigating.`
    : `**CURRENT PHASE: READY TO NAVIGATE**
You've fully explored this page (${MIN_EXPLORATIONS_PER_PAGE} successful interactions completed).
Navigate to an UNEXPLORED page - avoid pages marked as "Fully Explored".
${unexploredPages.length > 0 ? `Unexplored pages: ${unexploredPages.join(', ')}` : 'All major pages visited!'}`;

  const currentMessage = `
=== ITERATION ${state.iterationCount}/${CONFIG.MAX_ITERATIONS} ===

${phaseInstruction}

CURRENT LOCATION:
- URL: ${currentPage.url}
- Title: ${currentPage.title || 'Unknown'}
- Successful interactions on this page: ${state.currentPageSuccessCount}/${MIN_EXPLORATIONS_PER_PAGE}

EXPLORATION PROGRESS:
- Total Pages Visited: ${new Set(Array.from(state.visitedPages).map(u => u.split('?')[0])).size}
- Features Discovered: ${state.featureInventory.size}${fullyExploredPagesList}
${state.featureInventory.size > 0 ? Array.from(state.featureInventory.entries()).map(([name, desc]) => `  * ${name}`).join('\n') : ''}

FAILED ACTIONS (avoid these):
${failedActionsText || '  None yet'}

PAGE STRUCTURE:
${extractPageSections(pageHtml)}

AVAILABLE ELEMENTS:
${elements.slice(0, 15).map((el, i) => {
  const failed = state.failedActions.get(el.label) || 0;
  const failedMarker = failed > 0 ? ` [FAILED ${failed}x - AVOID]` : '';
  const navMarker = el.href && (el.href.includes('/dashboard') || el.href.includes('/jobs') || el.href.includes('/profile') || el.href.includes('/settings')) ? ' [NAV LINK]' : '';
  return `${i}. [${el.tag}] "${el.label}"${navMarker}${failedMarker}`;
}).join('\n')}

DECISION REQUIRED:
${state.pageExplorationPhase === 'explore'
  ? 'Click an IN-PAGE element to discover a feature (NOT a navigation link!)'
  : `Navigate to one of these unexplored pages: ${unexploredPages.join(', ')}`
}

Respond with JSON decision.`;

  try {
    log('Requesting AI decision with conversation context...', 'AI');

    // Add current message to conversation
    state.conversationHistory.push({
      role: 'user',
      content: currentMessage
    });

    // Call AI with full conversation history
    const response = await anthropic.messages.create({
      model: CONFIG.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: state.conversationHistory
    });

    const assistantMessage = response.content[0].text;

    // Add AI response to conversation history
    state.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });

    // Parse decision from response
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    // Sanitize JSON string - remove control characters and fix common issues
    let sanitizedJson = jsonMatch[0]
      .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
      .replace(/,\s*([}\]])/g, '$1')     // Remove trailing commas before } or ]
      .replace(/\n/g, ' ')                // Replace newlines with spaces
      .replace(/\r/g, '')                 // Remove carriage returns
      .replace(/\t/g, ' ');               // Replace tabs with spaces

    let decision;
    try {
      decision = JSON.parse(sanitizedJson);
    } catch (parseError) {
      log(`JSON parse error: ${parseError.message}`, 'ERROR');
      log(`Attempted to parse: ${sanitizedJson.substring(0, 200)}...`, 'ERROR');
      throw new Error(`Failed to parse AI JSON response: ${parseError.message}`);
    }

    if (!decision) {
      throw new Error('Failed to parse AI response');
    }

    log(`AI Decision: ${decision.action} on element ${decision.element_index}`, 'AI');
    log(`Reasoning: ${decision.reasoning}`, 'AI');

    // Record discovered feature if AI found one
    if (decision.feature_discovered && decision.feature_description) {
      await recordDiscoveredFeature(decision.feature_discovered, decision.feature_description);
    }

    state.aiDecisions.push({
      iteration: state.iterationCount,
      page: currentPage.url,
      decision,
      timestamp: Date.now()
    });

    return decision;
  } catch (error) {
    log(`AI decision error: ${error.message}`, 'ERROR');
    state.executionErrors.push({
      iteration: state.iterationCount,
      error: error.message,
      context: 'AI decision'
    });
    return null;
  }
}

// Helper to extract comprehensive page structure from HTML for cloning capability
function extractPageSections(html) {
  const analysis = {
    headings: [],
    navigation: [],
    buttons: [],
    forms: [],
    cards: [],
    modals: [],
    dataAttributes: [],
    hiddenElements: []
  };

  // Extract headings (all levels)
  const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
  analysis.headings = headingMatches
    .map(h => h.replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 0 && h.length < 200)
    .slice(0, 20);

  // Extract navigation items
  const navMatches = html.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>([^<]+)<\/a>/gi) || [];
  analysis.navigation = navMatches
    .map(link => {
      const hrefMatch = link.match(/href=["']([^"']*?)["']/);
      const textMatch = link.match(/>([^<]+)</);
      if (hrefMatch && textMatch) {
        return { href: hrefMatch[1], text: textMatch[1].trim() };
      }
      return null;
    })
    .filter(n => n && n.text.length > 0 && n.text.length < 100)
    .slice(0, 15);

  // Extract buttons with text and attributes
  const buttonMatches = html.match(/<button[^>]*>([^<]*)<\/button>/gi) || [];
  analysis.buttons = buttonMatches
    .map(btn => {
      const text = btn.replace(/<[^>]+>/g, '').trim();
      const classMatch = btn.match(/class=["']([^"']*?)["']/);
      const dataMatch = btn.match(/data-[a-z-]+=/gi);
      return {
        text: text.substring(0, 100),
        classes: classMatch ? classMatch[1].substring(0, 100) : '',
        hasDataAttrs: dataMatch ? dataMatch.length : 0
      };
    })
    .filter(b => b.text.length > 0)
    .slice(0, 20);

  // Extract forms and inputs
  const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [];
  analysis.forms = formMatches.map((form, idx) => {
    const inputMatches = form.match(/<input[^>]*>/gi) || [];
    const inputs = inputMatches.map(inp => {
      const nameMatch = inp.match(/name=["']([^"']*?)["']/);
      const typeMatch = inp.match(/type=["']([^"']*?)["']/);
      const placeholderMatch = inp.match(/placeholder=["']([^"']*?)["']/);
      return {
        name: nameMatch ? nameMatch[1] : '',
        type: typeMatch ? typeMatch[1] : 'text',
        placeholder: placeholderMatch ? placeholderMatch[1] : ''
      };
    });
    return { formIndex: idx, inputCount: inputs.length, inputs: inputs.slice(0, 5) };
  }).slice(0, 3);

  // Extract card-like components (divs with classes containing 'card', 'widget', 'panel')
  const cardMatches = html.match(/<div[^>]*class=["'][^"']*(?:card|widget|panel|container)[^"']*["'][^>]*>[\s\S]{0,500}?<\/div>/gi) || [];
  analysis.cards = cardMatches
    .map(card => {
      if (!card) return null; // Skip null/undefined cards

      const classMatch = card.match(/class=["']([^"']*?)["']/);
      const hasImage = card.includes('<img') || card.includes('background-image');
      const hasButton = card.includes('<button') || card.includes('role="button"');
      const hasLink = card.includes('<a href');
      const childElements = (card.match(/<(div|span|p|h[1-6]|button|a)/gi) || []).length;

      return {
        classes: classMatch ? classMatch[1].substring(0, 100) : '',
        structure: {
          hasImage,
          hasButton,
          hasLink,
          childElements
        }
      };
    })
    .filter(card => card !== null) // Remove null entries
    .slice(0, 10);

  // Extract modals/dialogs
  const modalMatches = html.match(/<div[^>]*(?:role=["']dialog["']|class=["'][^"']*modal[^"']*["'])[^>]*>[\s\S]{0,300}?/gi) || [];
  analysis.modals = modalMatches
    .map(modal => {
      const classMatch = modal.match(/class=["']([^"']*?)["']/);
      const idMatch = modal.match(/id=["']([^"']*?)["']/);
      return {
        id: idMatch ? idMatch[1] : '',
        classes: classMatch ? classMatch[1].substring(0, 100) : ''
      };
    })
    .slice(0, 5);

  // Extract important data attributes
  const dataAttrMatches = html.match(/data-([a-z-]+)=["']([^"']*?)["']/gi) || [];
  const dataAttrMap = new Map();
  dataAttrMatches.slice(0, 50).forEach(attr => {
    const match = attr.match(/data-([a-z-]+)=["']([^"']*?)["']/);
    if (match) {
      const key = match[1];
      if (!dataAttrMap.has(key)) {
        dataAttrMap.set(key, match[2].substring(0, 50));
      }
    }
  });
  analysis.dataAttributes = Array.from(dataAttrMap.entries()).slice(0, 15);

  // Extract hidden/disabled elements (opacity-40, disabled, aria-disabled)
  const hiddenMatches = html.match(/<[^>]*(?:opacity-40|disabled|aria-disabled=["']true["'])[^>]*>([^<]*)</gi) || [];
  analysis.hiddenElements = hiddenMatches
    .map(el => el.replace(/<[^>]+>/g, '').trim())
    .filter(text => text.length > 0 && text.length < 100)
    .slice(0, 10);

  // Format for AI consumption
  let output = '';

  if (analysis.headings.length > 0) {
    output += '📋 HEADINGS:\n' + analysis.headings.map(h => `  • ${h}`).join('\n') + '\n\n';
  }

  if (analysis.navigation.length > 0) {
    output += '🔗 NAVIGATION LINKS:\n' + analysis.navigation.map(n => `  • ${n.text} → ${n.href}`).join('\n') + '\n\n';
  }

  if (analysis.buttons.length > 0) {
    output += '🔘 BUTTONS:\n' + analysis.buttons.slice(0, 15).map(b => `  • "${b.text}" ${b.hasDataAttrs ? `[${b.hasDataAttrs} data attrs]` : ''}`).join('\n') + '\n\n';
  }

  if (analysis.forms.length > 0) {
    output += '📝 FORMS:\n' + analysis.forms.map(f => {
      return `  Form ${f.formIndex + 1}: ${f.inputCount} inputs (${f.inputs.map(i => i.type).join(', ')})`;
    }).join('\n') + '\n\n';
  }

  if (analysis.cards.length > 0) {
    output += '📦 CARD/WIDGET PATTERNS:\n' + analysis.cards.slice(0, 8).map((c, idx) => {
      const features = [];
      if (c.structure.hasImage) features.push('image');
      if (c.structure.hasButton) features.push('button');
      if (c.structure.hasLink) features.push('link');
      return `  ${idx + 1}. Classes: ${c.classes.substring(0, 60)}... [${features.join(', ')}] (${c.structure.childElements} elements)`;
    }).join('\n') + '\n\n';
  }

  if (analysis.modals.length > 0) {
    output += '💬 MODALS/DIALOGS:\n' + analysis.modals.map(m => `  • ${m.id || 'Modal'} (${m.classes})`).join('\n') + '\n\n';
  }

  if (analysis.hiddenElements.length > 0) {
    output += '🙈 HIDDEN/DISABLED ELEMENTS:\n' + analysis.hiddenElements.map(h => `  • ${h}`).join('\n') + '\n\n';
  }

  if (analysis.dataAttributes.length > 0) {
    output += '🏷️  DATA ATTRIBUTES:\n' + analysis.dataAttributes.map(([k, v]) => `  • data-${k}="${v}"`).join('\n') + '\n\n';
  }

  return output || '- Page loaded (no clear structure detected)';
}

// ==================== ACTIONS ====================

// Enhanced modal/dialog detection
async function detectModalOrDialog(page) {
  return await page.evaluate(() => {
    // Check for various modal/dialog/overlay indicators
    const modalSelectors = [
      '[role="dialog"]',
      '[role="menu"]',
      '[role="alertdialog"]',
      '[aria-modal="true"]',
      '.modal',
      '.dialog',
      '.dropdown-menu',
      '.popover',
      '[data-modal]',
      '[data-dialog]',
      // Check for overlays/backdrops (common in modals)
      '.modal-backdrop',
      '.overlay',
      '[class*="backdrop"]',
      '[class*="overlay"]'
    ];

    for (const selector of modalSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Check if element is actually visible
        if (style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            parseFloat(style.opacity) > 0.1 &&
            rect.width > 0 &&
            rect.height > 0) {
          return true;
        }
      }
    }

    // Check if any element got z-index boost (common modal pattern)
    const highZIndex = Array.from(document.querySelectorAll('*')).some(el => {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex);
      return zIndex > 900 && style.display !== 'none';
    });

    return highZIndex;
  });
}

// Better element selector generation with multiple fallbacks
async function findElementAndGenerateSelector(page, element) {
  return await page.evaluate((el) => {
    const allSelectors = [
      'a', 'button', '[role="button"]', '[role="tab"]',
      '[role="menuitem"]', 'input', 'select', 'div[onclick]',
      '[data-testid]', '[aria-label]'
    ];

    // Find all matching elements
    const allElements = [];
    allSelectors.forEach(sel => {
      try {
        const elems = document.querySelectorAll(sel);
        allElements.push(...Array.from(elems));
      } catch (e) {}
    });

    // Find best match by text and position
    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of allElements) {
      const rect = candidate.getBoundingClientRect();
      const text = (candidate.textContent || candidate.innerText || '').trim();
      const ariaLabel = candidate.getAttribute('aria-label') || '';
      const title = candidate.getAttribute('title') || '';
      const candidateText = text || ariaLabel || title;

      // Calculate match score
      let score = 0;

      // Text match (most important)
      if (candidateText.includes(el.label.substring(0, 30))) {
        score += 100;
      } else if (candidateText.substring(0, 20) === el.label.substring(0, 20)) {
        score += 80;
      }

      // Position match (secondary)
      const positionDiff = Math.abs(rect.x - el.position.x) + Math.abs(rect.y - el.position.y);
      if (positionDiff < 5) {
        score += 50;
      } else if (positionDiff < 20) {
        score += 30;
      } else if (positionDiff < 50) {
        score += 10;
      }

      // Visibility boost
      const style = window.getComputedStyle(candidate);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        score += 20;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (!bestMatch) return null;

    // Generate selector priority: id > data-testid > aria-label > class > xpath
    if (bestMatch.id) {
      return { selector: `#${bestMatch.id}`, method: 'id' };
    }

    const testId = bestMatch.getAttribute('data-testid');
    if (testId) {
      return { selector: `[data-testid="${testId}"]`, method: 'data-testid' };
    }

    const ariaLabel = bestMatch.getAttribute('aria-label');
    if (ariaLabel) {
      return { selector: `[aria-label="${ariaLabel}"]`, method: 'aria-label' };
    }

    // Try class-based selector
    if (bestMatch.className) {
      const classes = bestMatch.className.toString().split(' ').filter(c => c && !c.includes(' ') && c.length > 2);
      if (classes.length > 0) {
        // Try first class
        const selector = `${bestMatch.tagName.toLowerCase()}.${classes[0]}`;
        const matches = document.querySelectorAll(selector);
        if (matches.length === 1) {
          return { selector, method: 'class' };
        }
        // Try first two classes
        if (classes.length > 1) {
          const selector2 = `${bestMatch.tagName.toLowerCase()}.${classes[0]}.${classes[1]}`;
          const matches2 = document.querySelectorAll(selector2);
          if (matches2.length === 1) {
            return { selector: selector2, method: 'class' };
          }
        }
      }
    }

    // Try href for links
    if (bestMatch.tagName === 'A' && bestMatch.getAttribute('href')) {
      const href = bestMatch.getAttribute('href');
      return { selector: `a[href="${href}"]`, method: 'href' };
    }

    // Last resort: text-based selector
    const shortText = bestMatch.textContent.trim().substring(0, 30);
    if (shortText) {
      return { selector: `//*[contains(text(), "${shortText}")]`, method: 'xpath' };
    }

    return { selector: bestMatch.tagName.toLowerCase(), method: 'tag' };
  }, element);
}

async function executeAction(page, action, element) {
  try {
    log(`Executing: ${action.action} on "${element.label}"`, 'ACTION');

    const currentUrl = page.url();

    // Try direct navigation for known pages first
    const knownPages = {
      'Jobs': '/jobs',
      'Applications': '/applications',
      'Profile': '/profile',
      'Settings': '/settings',
      'Companies': '/companies',
      'Documents': '/documents'
    };

    // Check if this is a known navigation element
    for (const [keyword, path] of Object.entries(knownPages)) {
      if (element.label.includes(keyword) && !currentUrl.includes(path)) {
        log(`Trying direct navigation to ${path}`, 'INFO');
        try {
          await page.goto(`${CONFIG.BASE_URL}${path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
          await page.waitForTimeout(2000);

          if (page.url() !== currentUrl) {
            log(`Successfully navigated to ${page.url()}`, 'SUCCESS');
            return true;
          }
        } catch (e) {
          log(`Direct navigation failed: ${e.message}`, 'INFO');
        }
      }
    }

    // Find element with enhanced selector
    const selectorInfo = await findElementAndGenerateSelector(page, element);

    if (!selectorInfo) {
      log(`Could not find element: ${element.label}`, 'ERROR');
      return false;
    }

    log(`Found element using ${selectorInfo.method}: ${selectorInfo.selector}`, 'INFO');

    switch (action.action) {
      case 'click':
      case 'navigate':
        // Try multiple interaction strategies
        try {
          const locator = selectorInfo.method === 'xpath'
            ? page.locator(selectorInfo.selector)
            : page.locator(selectorInfo.selector);

          // Strategy 1: Scroll into view and wait for element
          try {
            await locator.first().scrollIntoViewIfNeeded({ timeout: 3000 });
            await page.waitForTimeout(500);
          } catch (e) {
            log('Scroll into view failed, continuing...', 'INFO');
          }

          // Strategy 2: Hover then click (reveals hidden elements)
          try {
            await locator.first().hover({ timeout: 2000 });
            await page.waitForTimeout(300);
          } catch (e) {
            log('Hover failed, continuing...', 'INFO');
          }

          // Strategy 3: Click with retry
          let clicked = false;
          for (let attempt = 1; attempt <= 3 && !clicked; attempt++) {
            try {
              log(`Click attempt ${attempt}/3`, 'INFO');
              await locator.first().click({ timeout: 5000 });
              clicked = true;
              await page.waitForTimeout(3000); // Longer wait for animations
            } catch (e) {
              log(`Click attempt ${attempt} failed: ${e.message}`, 'INFO');
              if (attempt < 3) {
                await page.waitForTimeout(1000);
              }
            }
          }

          if (!clicked) {
            // Try force click as last resort
            try {
              await locator.first().click({ force: true, timeout: 3000 });
              clicked = true;
              await page.waitForTimeout(3000);
            } catch (e) {
              log('All click attempts failed', 'ERROR');
              const failCount = state.failedActions.get(element.label) || 0;
              state.failedActions.set(element.label, failCount + 1);
              return false;
            }
          }

          // Check results
          const newUrl = page.url();

          // Check 1: URL changed?
          if (newUrl !== currentUrl) {
            log(`Navigation successful - URL changed to ${newUrl}`, 'SUCCESS');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);
            return true;
          }

          // Check 2: Modal/dialog appeared?
          const hasModal = await detectModalOrDialog(page);
          if (hasModal) {
            log(`Modal/dialog detected - successful interaction!`, 'SUCCESS');
            await page.waitForTimeout(2000);
            return true;
          }

          // Check 3: DOM changed significantly?
          await page.waitForTimeout(1000);
          const domChanged = await page.evaluate(() => {
            // Check if new high-visibility elements appeared
            const newElements = document.querySelectorAll('[role="dialog"], [role="menu"], .modal, [data-modal], form[style*="display"], div[style*="display"]');
            return newElements.length > 0;
          });

          if (domChanged) {
            log(`DOM changes detected - possible interaction success`, 'SUCCESS');
            return true;
          }

          // No changes detected
          log(`No visible changes after click - marking as failed`, 'INFO');
          const failCount = state.failedActions.get(element.label) || 0;
          state.failedActions.set(element.label, failCount + 1);
          return false;

        } catch (clickError) {
          log(`Click error: ${clickError.message}`, 'ERROR');
          const failCount = state.failedActions.get(element.label) || 0;
          state.failedActions.set(element.label, failCount + 1);
          return false;
        }

      case 'fill_form':
        log('Form filling not yet implemented', 'INFO');
        break;

      case 'scroll':
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
        break;
    }

    return true;
  } catch (error) {
    log(`Action failed: ${error.message}`, 'ERROR');
    state.executionErrors.push({
      iteration: state.iterationCount,
      error: error.message,
      action: action.action,
      element: element.label
    });
    return false;
  }
}

// ==================== FEATURE DISCOVERY & COMPONENT CATALOGING ====================
// AI will discover features organically - no hardcoded expectations

async function recordDiscoveredFeature(featureName, description) {
  if (!state.featureInventory.has(featureName)) {
    state.featureInventory.set(featureName, description);
    log(`Feature discovered: ${featureName}`, 'DISCOVERY');
  }
}

// Save detailed page component analysis for cloning capability
async function savePageComponentAnalysis(pageUrl, pageHtml, iterationNumber) {
  try {
    const analysis = {
      url: pageUrl,
      timestamp: Date.now(),
      iteration: iterationNumber,
      components: {}
    };

    // Extract all structural components
    const headings = (pageHtml.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi) || []).map(h => ({
      html: h.substring(0, 200),
      text: h.replace(/<[^>]+>/g, '').trim().substring(0, 100)
    }));

    const navLinks = (pageHtml.match(/<a[^>]*href=["']([^"']*?)["'][^>]*>([^<]*)<\/a>/gi) || [])
      .map(link => {
        const hrefMatch = link.match(/href=["']([^"']*?)["']/);
        const textMatch = link.match(/>([^<]*)</);
        const classMatch = link.match(/class=["']([^"']*?)["']/);
        return {
          href: hrefMatch ? hrefMatch[1] : '',
          text: textMatch ? textMatch[1].trim() : '',
          classes: classMatch ? classMatch[1] : '',
          html: link.substring(0, 300)
        };
      })
      .filter(l => l.text.length > 0)
      .slice(0, 30);

    const buttons = (pageHtml.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [])
      .map(btn => ({
        text: btn.replace(/<[^>]+>/g, '').trim().substring(0, 100),
        html: btn.substring(0, 300),
        classes: (btn.match(/class=["']([^"']*?)["']/) || [])[1] || '',
        dataAttrs: (btn.match(/data-[a-z-]+=/gi) || [])
      }))
      .filter(b => b.text.length > 0)
      .slice(0, 30);

    const forms = (pageHtml.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || [])
      .map((form, idx) => {
        const inputs = (form.match(/<input[^>]*>/gi) || []).map(inp => ({
          name: (inp.match(/name=["']([^"']*?)["']/) || [])[1] || '',
          type: (inp.match(/type=["']([^"']*?)["']/) || [])[1] || 'text',
          placeholder: (inp.match(/placeholder=["']([^"']*?)["']/) || [])[1] || '',
          html: inp
        }));
        return { formIndex: idx, inputs, html: form.substring(0, 1000) };
      })
      .slice(0, 5);

    const cards = (pageHtml.match(/<div[^>]*class=["'][^"']*(?:card|widget|panel|item)[^"']*["'][^>]*>[\s\S]{0,800}?<\/div>/gi) || [])
      .map(card => {
        const classes = (card.match(/class=["']([^"']*?)["']/) || [])[1] || '';
        const dataAttrs = (card.match(/data-[a-z-]+=/gi) || []);

        // Extract STRUCTURE, not content - just placeholders
        const hasImage = card.includes('<img') || card.includes('background-image');
        const hasButton = card.includes('<button') || card.includes('role="button"');
        const hasLink = card.includes('<a href');

        return {
          classes: classes,
          dataAttrTypes: [...new Set(dataAttrs.map(attr => attr.replace(/=/g, '')))], // Just attribute names, not values
          structure: {
            hasImage,
            hasButton,
            hasLink,
            childElements: (card.match(/<(div|span|p|h[1-6]|button|a)/gi) || []).length
          },
          htmlPattern: card.replace(/>[^<]+</g, '><CONTENT><').substring(0, 400) // Structure only, replace text with placeholder
        };
      })
      .slice(0, 10); // Limit to 10 unique card types

    const modals = (pageHtml.match(/<div[^>]*(?:role=["']dialog["']|class=["'][^"']*modal[^"']*["'])[^>]*>[\s\S]{0,800}?/gi) || [])
      .map(modal => ({
        id: (modal.match(/id=["']([^"']*?)["']/) || [])[1] || '',
        classes: (modal.match(/class=["']([^"']*?)["']/) || [])[1] || '',
        html: modal.substring(0, 800)
      }))
      .slice(0, 10);

    // Extract data attributes (indicators of functionality)
    const dataAttributes = {};
    const dataMatches = pageHtml.match(/data-([a-z-]+)=["']([^"']*?)["']/gi) || [];
    dataMatches.slice(0, 100).forEach(attr => {
      const match = attr.match(/data-([a-z-]+)=["']([^"']*?)["']/);
      if (match) {
        const key = match[1];
        if (!dataAttributes[key]) {
          dataAttributes[key] = [];
        }
        if (dataAttributes[key].length < 5) {
          dataAttributes[key].push(match[2].substring(0, 100));
        }
      }
    });

    // Store all component data
    analysis.components = {
      headings: headings.slice(0, 25),
      navigation: navLinks,
      buttons: buttons,
      forms: forms,
      cards: cards,
      modals: modals,
      dataAttributes: dataAttributes,
      stats: {
        totalHeadings: headings.length,
        totalLinks: navLinks.length,
        totalButtons: buttons.length,
        totalForms: forms.length,
        totalCards: cards.length,
        totalModals: modals.length
      }
    };

    // Save to file
    const pageBase = pageUrl.split('?')[0].split('/').pop() || 'root';
    const filename = `components/page-${pageBase}-iter${iterationNumber}-${Date.now()}.json`;
    await saveState(filename, analysis);

    log(`Saved component analysis: ${analysis.components.stats.totalButtons} buttons, ${analysis.components.stats.totalCards} cards, ${analysis.components.stats.totalForms} forms`, 'SUCCESS');

  } catch (error) {
    log(`Failed to save component analysis: ${error.message}`, 'ERROR');
  }
}

// ==================== MAIN EXPLORATION LOOP ====================

async function exploreSimplify() {
  log('Starting Simplify.jobs AI-Guided Analysis', 'INFO');

  // Initialize
  await ensureDirectories();

  // Load credentials
  const credPath = path.join(__dirname, '../.credentials');
  let credentials = {};

  try {
    const credContent = await fs.readFile(credPath, 'utf-8');
    credContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          credentials[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    // Validate Anthropic API key
    if (!credentials.ANTHROPIC_API_KEY) {
      log('ERROR: ANTHROPIC_API_KEY not found in .credentials file', 'ERROR');
      log('Add it to .credentials file: ANTHROPIC_API_KEY=sk-ant-api03-...', 'ERROR');
      return;
    }

    // Initialize Anthropic client
    anthropic = new Anthropic({
      apiKey: credentials.ANTHROPIC_API_KEY
    });
    log('Anthropic API client initialized', 'SUCCESS');

    if (!credentials.SIMPLIFY_EMAIL || !credentials.SIMPLIFY_PASSWORD) {
      log('No Simplify credentials found. You will need to login manually.', 'INFO');
    }
  } catch (error) {
    log(`Error loading credentials: ${error.message}`, 'ERROR');
    log('You will need to login manually.', 'INFO');
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: CONFIG.HEADLESS,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: CONFIG.VIEWPORT,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    // Navigate to login
    log('Navigating to Simplify.jobs login...', 'INFO');
    await page.goto(CONFIG.LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
      // Check if we have credentials
      if (credentials.SIMPLIFY_EMAIL && credentials.SIMPLIFY_PASSWORD) {
        log('Credentials found, logging in automatically...', 'INFO');

        try {
          // Wait for login form
          log('Waiting for login form...', 'INFO');
          await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
          await page.waitForTimeout(1000);

          // Fill email
          log('Entering email...', 'INFO');
          const emailField = page.locator('input[type="email"], input[name="email"]').first();
          await emailField.click();
          await emailField.fill(credentials.SIMPLIFY_EMAIL);
          await page.waitForTimeout(500);

          // Fill password
          log('Entering password...', 'INFO');
          const passwordField = page.locator('input[type="password"], input[name="password"]').first();
          await passwordField.click();
          await passwordField.fill(credentials.SIMPLIFY_PASSWORD);
          await page.waitForTimeout(1000);

          // Submit form
          log('Submitting login form...', 'INFO');
          const submitBtn = page.locator('button:has-text("Log In"), button:has-text("Log in"), button:has-text("Sign In"), button:has-text("Sign in"), button[type="submit"]').first();
          await submitBtn.click();

          // Wait for navigation away from login page OR timeout
          try {
            await page.waitForFunction(() =>
              !window.location.href.includes('/auth/login') &&
              !window.location.href.includes('/login'),
              { timeout: 10000 }
            );
            log(`Login redirect successful - now at: ${page.url()}`, 'SUCCESS');
          } catch (e) {
            log('Login may have failed - still on login page', 'ERROR');
          }

          await page.waitForTimeout(3000);
          log('Login successful!', 'SUCCESS');
        } catch (error) {
          log(`Auto-login failed: ${error.message}`, 'ERROR');
          log('Please login manually in the browser window...', 'INFO');
          log('Waiting 60 seconds for manual login...', 'INFO');

          // Fallback to manual login
          await page.waitForFunction(() =>
            !window.location.href.includes('/auth/login') &&
            !window.location.href.includes('/login'),
            { timeout: 60000 }
          );
          log('Manual login successful!', 'SUCCESS');
        }
      } else {
        // No credentials, wait for manual login
        log('No credentials found. Please login manually...', 'INFO');
        log('Waiting 60 seconds for manual login...', 'INFO');

        // Wait for navigation away from login page
        try {
          await page.waitForFunction(() =>
            !window.location.href.includes('/auth/login') &&
            !window.location.href.includes('/login'),
            { timeout: 60000 }
          );
          log('Login successful!', 'SUCCESS');
        } catch (error) {
          log('Login timeout. Please ensure you are logged in.', 'ERROR');
          return;
        }
      }
    }

    await page.waitForTimeout(3000);

    // Check if we successfully logged in
    const finalUrl = page.url();
    if (finalUrl.includes('/auth/login') || finalUrl.includes('/login')) {
      log('ERROR: Still on login page after login attempt!', 'ERROR');
      log('Please check credentials in .credentials file or try manual login', 'ERROR');
      log('Waiting 30 seconds for manual intervention...', 'INFO');

      await page.waitForTimeout(30000);

      // Check again
      if (page.url().includes('/auth/login') || page.url().includes('/login')) {
        log('Still on login page - aborting', 'ERROR');
        return;
      }
    }

    log(`Ready to explore! Current URL: ${page.url()}`, 'SUCCESS');

    // Main exploration loop
    while (state.iterationCount < CONFIG.MAX_ITERATIONS) {
      state.iterationCount++;
      log(`\n========== ITERATION ${state.iterationCount}/${CONFIG.MAX_ITERATIONS} ==========`, 'INFO');

      // Press ESC at start of each iteration to clear any lingering modals
      try {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        log('Pressed ESC at start of iteration to clear any modals', 'INFO');
      } catch (e) {
        // Silently ignore ESC errors
      }

      // Get current page info (with navigation safety)
      let currentUrl, currentTitle;
      try {
        // Wait for page to be stable after any navigation
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        await page.waitForTimeout(500);

        currentUrl = page.url();
        currentTitle = await page.title();
      } catch (e) {
        log(`Page not ready, retrying... ${e.message}`, 'INFO');
        await page.waitForTimeout(2000);
        currentUrl = page.url();
        currentTitle = await page.title();
      }

      // CRITICAL: If we're on an external site (not simplify.jobs), navigate back to dashboard
      if (!currentUrl.includes('simplify.jobs')) {
        log(`⚠️  Detected external site: ${currentUrl}`, 'INFO');
        log(`Navigating back to simplify.jobs/dashboard...`, 'INFO');
        try {
          await page.goto(`${CONFIG.BASE_URL}/dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });
          await page.waitForTimeout(2000);
          log(`✅ Successfully returned to simplify.jobs`, 'SUCCESS');
          continue; // Skip to next iteration on simplify.jobs
        } catch (e) {
          log(`Failed to return to simplify.jobs: ${e.message}`, 'ERROR');
          break; // Exit if we can't return
        }
      }

      log(`Current Page: ${currentTitle} (${currentUrl})`, 'INFO');

      // Mark as visited
      state.visitedPages.add(currentUrl);

      // Capture page
      await capturePage(page, currentTitle || `Page_${state.iterationCount}`);

      // Get page HTML for AI analysis
      const pageHtml = await page.content();
      state.pageContents.set(currentUrl, pageHtml);

      // Save detailed component analysis for cloning capability
      await savePageComponentAnalysis(currentUrl, pageHtml, state.iterationCount);

      // Extract elements
      const elements = await extractInteractiveElements(page);
      log(`Found ${elements.length} interactive elements`, 'INFO');

      // Save elements
      await saveState(
        `elements/iter${state.iterationCount}-${Date.now()}.json`,
        { url: currentUrl, elements }
      );

      // Filter elements
      const relevantElements = filterRelevantElements(elements, { url: currentUrl, title: currentTitle });
      log(`Filtered to ${relevantElements.length} relevant elements`, 'INFO');

      if (relevantElements.length === 0) {
        log('No relevant elements found. Moving on...', 'INFO');
        break;
      }

      // Get AI decision with full context
      const decision = await getAIDecision(relevantElements, { url: currentUrl, title: currentTitle }, pageHtml);

      if (!decision || decision.action === 'done') {
        log('AI decided exploration is complete', 'SUCCESS');
        break;
      }

      // Execute action
      const targetElement = relevantElements[decision.element_index];
      if (!targetElement) {
        log(`Invalid element index: ${decision.element_index}`, 'ERROR');
        continue;
      }

      const previousUrl = currentUrl;
      const success = await executeAction(page, decision, targetElement);

      // Increment success counter and update page exploration data
      if (success) {
        state.currentPageSuccessCount++;

        // Update page exploration data with success count
        const currentPageBase = currentUrl.split('?')[0];
        const pageData = state.exploredPages.get(currentPageBase);
        if (pageData) {
          pageData.successCount = state.currentPageSuccessCount;
        }

        // Close any open modals with ESC key to prevent blocking
        try {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          log('Pressed ESC to close any open modals', 'INFO');
        } catch (e) {
          log(`ESC press failed: ${e.message}`, 'INFO');
        }
      }

      // Provide feedback to AI about action result
      const newUrl = page.url();
      let feedbackMessage = '';

      if (!success) {
        feedbackMessage = `ACTION RESULT: Failed. Element "${targetElement.label}" did not trigger navigation or open any modal/dropdown. This element is not useful for exploration. I will avoid this in future iterations.`;
        log('Action failed, trying next element...', 'ERROR');
      } else if (newUrl !== previousUrl) {
        feedbackMessage = `ACTION RESULT: Success! Navigated from ${previousUrl} to ${newUrl}. New page discovered!`;
        log(`Successfully navigated to new page: ${newUrl}`, 'SUCCESS');
      } else {
        feedbackMessage = `ACTION RESULT: Success! Element "${targetElement.label}" triggered an in-page interaction (modal, dropdown, or form). This is valuable - the page now shows additional UI elements or options that weren't visible before. Continue exploring elements on this page.`;
        log(`In-page interaction detected (modal/dropdown/form)`, 'SUCCESS');
      }

      // Add feedback to conversation
      state.conversationHistory.push({
        role: 'user',
        content: feedbackMessage
      });

      // Wait for page to settle
      await page.waitForTimeout(2000);
    }

    // Final state save
    await saveState('feature-inventory.json', Array.from(state.featureInventory.entries()));
    await saveState('visited-pages.json', Array.from(state.visitedPages));
    await saveState('ai-decisions.json', state.aiDecisions);
    await saveState('execution-errors.json', state.executionErrors);
    await saveState('explored-pages.json', Array.from(state.exploredPages.entries()));

    // Generate summary
    const summary = {
      totalIterations: state.iterationCount,
      totalPages: state.visitedPages.size,
      totalFeatures: state.featureInventory.size,
      totalErrors: state.executionErrors.length,
      duration: Date.now() - state.startTime,
      features: Array.from(state.featureInventory.entries()),
      pages: Array.from(state.visitedPages),
      exploredPages: Array.from(state.exploredPages.entries()).map(([url, data]) => ({
        url,
        iterations: data.iterationCount,
        fullyExplored: data.fullyExplored
      }))
    };

    await saveState('FINAL_SUMMARY.json', summary);

    log('\n========== ANALYSIS COMPLETE ==========', 'SUCCESS');
    log(`Total Iterations: ${summary.totalIterations}`, 'INFO');
    log(`Pages Explored: ${summary.totalPages}`, 'INFO');
    log(`Features Discovered: ${summary.totalFeatures}`, 'INFO');
    log(`Duration: ${Math.round(summary.duration / 1000)}s`, 'INFO');

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    console.error(error);
  } finally {
    await browser.close();
  }
}

// ==================== ENTRY POINT ====================

exploreSimplify().catch(console.error);
