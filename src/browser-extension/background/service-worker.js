// Background Service Worker for Extension
const API_BASE_URL = 'http://localhost:3000/api';

// Plugin registry
const plugins = new Map();

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Autonomous AI Extension installed');

  // Set default configuration
  chrome.storage.local.set({
    apiUrl: API_BASE_URL,
    autoScrape: false,
    plugins: []
  });
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'scrapeCurrentPage':
      handleScrapeCurrentPage(sender.tab, request.selectors)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep channel open for async response

    case 'generateCode':
      handleGenerateCode(request.prompt)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'registerPlugin':
      registerPlugin(request.plugin);
      sendResponse({ success: true });
      break;

    case 'executePlugin':
      executePlugin(request.pluginName, request.context)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Scrape current page
async function handleScrapeCurrentPage(tab, selectors) {
  try {
    // Inject content script if needed
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageData,
      args: [selectors]
    });

    // Send to backend API
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: tab.url,
        data: result.result,
        timestamp: new Date().toISOString()
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}

// Function injected into page context
function extractPageData(selectors) {
  const data = {};

  if (!selectors || Object.keys(selectors).length === 0) {
    // Default extraction
    data.title = document.title;
    data.url = window.location.href;
    data.headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.trim());
    data.links = Array.from(document.querySelectorAll('a'))
      .map(a => ({ text: a.textContent.trim(), href: a.href }));
  } else {
    // Custom selectors
    for (const [key, selector] of Object.entries(selectors)) {
      const elements = document.querySelectorAll(selector);
      data[key] = Array.from(elements).map(el => el.textContent.trim());
    }
  }

  return data;
}

// Generate code using AI
async function handleGenerateCode(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    return await response.json();
  } catch (error) {
    console.error('Code generation failed:', error);
    throw error;
  }
}

// Plugin system
function registerPlugin(plugin) {
  console.log(`Registering plugin: ${plugin.name}`);
  plugins.set(plugin.name, plugin);

  // Store in chrome.storage
  chrome.storage.local.get(['plugins'], (result) => {
    const currentPlugins = result.plugins || [];
    currentPlugins.push(plugin);
    chrome.storage.local.set({ plugins: currentPlugins });
  });
}

async function executePlugin(pluginName, context) {
  const plugin = plugins.get(pluginName);
  if (!plugin) {
    throw new Error(`Plugin '${pluginName}' not found`);
  }

  console.log(`Executing plugin: ${pluginName}`);

  // Execute plugin function
  // Note: In production, this should be properly sandboxed
  return await plugin.execute(context);
}

// Context menu integration
chrome.contextMenus.create({
  id: 'scrapeElement',
  title: 'Scrape this element',
  contexts: ['all']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scrapeElement') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'scrapeElement',
      context: info
    });
  }
});
