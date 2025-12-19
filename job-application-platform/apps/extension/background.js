// JobFlow Extension - Background Service Worker

// Track extension state per tab
const extensionState = new Map(); // tabId -> boolean (true = ON, false = OFF)
const injectedTabs = new Set(); // Track which tabs have scripts injected

// Toggle extension ON/OFF when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Check if tab URL is valid for content scripts
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
    console.log('Cannot inject content script into this page');
    return;
  }

  try {
    // Toggle extension state for this tab
    const currentState = extensionState.get(tab.id) || false;
    const newState = !currentState;
    extensionState.set(tab.id, newState);

    console.log(`JobFlow: Extension ${newState ? 'ON' : 'OFF'} for tab ${tab.id}`);

    // If turning ON and scripts not injected yet, inject them
    if (newState && !injectedTabs.has(tab.id)) {
      console.log('Injecting content scripts for tab', tab.id);

      // Inject scripts in order: api.js, content.js, floating-panel.js
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['api.js']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['floating-panel.js']
      });

      injectedTabs.add(tab.id);
      console.log('Scripts injected successfully');

      // Wait a moment for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Send message to content script to show/hide extension
    await chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_EXTENSION_STATE',
      isEnabled: newState
    });
  } catch (error) {
    console.log('Error toggling extension:', error.message);
    // If injection failed, clean up state
    if (error.message.includes('Cannot access')) {
      extensionState.delete(tab.id);
      injectedTabs.delete(tab.id);
    }
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_EXTENSION_STATE') {
    const state = extensionState.get(sender.tab.id) || false;
    sendResponse({ isEnabled: state });
    return true;
  }

  // Proxy API requests to avoid CORS issues
  // Content scripts inherit the page's origin, but background scripts use chrome-extension://
  if (message.type === 'API_REQUEST') {
    const { url, options } = message;

    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(error.error || `HTTP ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep message channel open for async response
  }
});

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  extensionState.delete(tabId);
  injectedTabs.delete(tabId);
});

// Clean up state when tab navigates to a new URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Page is navigating, reset state
    extensionState.delete(tabId);
    injectedTabs.delete(tabId);
  }
});

console.log('JobFlow background service worker initialized');
