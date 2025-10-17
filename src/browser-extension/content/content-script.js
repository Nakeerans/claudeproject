// Content Script - Runs in the context of web pages
console.log('Autonomous AI Extension content script loaded');

// Store for element selection
let selectedElement = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'scrapeElement':
      scrapeElement(request.context);
      break;

    case 'highlightElements':
      highlightElements(request.selector);
      break;

    case 'extractData':
      const data = extractData(request.config);
      sendResponse({ success: true, data });
      break;
  }
});

// Element selection mode
function enableSelectionMode() {
  document.addEventListener('click', elementClickHandler, true);
  document.body.style.cursor = 'crosshair';
}

function disableSelectionMode() {
  document.removeEventListener('click', elementClickHandler, true);
  document.body.style.cursor = 'default';
  if (selectedElement) {
    selectedElement.style.outline = '';
  }
}

function elementClickHandler(event) {
  event.preventDefault();
  event.stopPropagation();

  selectedElement = event.target;
  selectedElement.style.outline = '2px solid #4CAF50';

  // Extract element data
  const elementData = {
    tag: selectedElement.tagName.toLowerCase(),
    text: selectedElement.textContent.trim(),
    html: selectedElement.innerHTML,
    selector: generateSelector(selectedElement),
    attributes: Array.from(selectedElement.attributes).reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {})
  };

  // Send to background script
  chrome.runtime.sendMessage({
    action: 'elementSelected',
    data: elementData
  });
}

// Generate unique CSS selector for element
function generateSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }

  const path = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.className) {
      selector += `.${current.className.trim().split(/\s+/).join('.')}`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

// Scrape specific element
function scrapeElement(context) {
  const element = document.elementFromPoint(context.x, context.y);
  if (!element) return;

  const data = {
    text: element.textContent.trim(),
    html: element.innerHTML,
    selector: generateSelector(element),
    tag: element.tagName.toLowerCase()
  };

  chrome.runtime.sendMessage({
    action: 'scraped',
    data: data
  });
}

// Highlight elements matching selector
function highlightElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.style.outline = '2px solid #2196F3';
  });

  setTimeout(() => {
    elements.forEach(el => {
      el.style.outline = '';
    });
  }, 3000);
}

// Extract data based on configuration
function extractData(config) {
  const results = {};

  for (const [key, selector] of Object.entries(config.selectors || {})) {
    const elements = document.querySelectorAll(selector);
    results[key] = Array.from(elements).map(el => ({
      text: el.textContent.trim(),
      html: el.innerHTML,
      attributes: Array.from(el.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
    }));
  }

  return results;
}

// Auto-extraction based on page structure
function autoExtract() {
  return {
    title: document.title,
    url: window.location.href,
    meta: {
      description: document.querySelector('meta[name="description"]')?.content,
      keywords: document.querySelector('meta[name="keywords"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content
    },
    headings: {
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
      h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim())
    },
    links: Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.textContent.trim(),
      href: a.href
    })),
    images: Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt
    }))
  };
}

// Create floating UI for quick actions
function createFloatingUI() {
  const container = document.createElement('div');
  container.id = 'ai-extension-ui';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    display: none;
  `;

  container.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">AI Extension</div>
    <button id="ai-ext-select">Select Element</button>
    <button id="ai-ext-auto">Auto Extract</button>
  `;

  document.body.appendChild(container);

  document.getElementById('ai-ext-select')?.addEventListener('click', enableSelectionMode);
  document.getElementById('ai-ext-auto')?.addEventListener('click', () => {
    const data = autoExtract();
    chrome.runtime.sendMessage({
      action: 'autoExtracted',
      data: data
    });
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // createFloatingUI();
  });
} else {
  // createFloatingUI();
}
