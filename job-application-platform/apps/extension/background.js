// JobFlow Extension - Background Service Worker

// Track extension state per tab
const extensionState = new Map(); // tabId -> boolean (true = ON, false = OFF)

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

    // Send message to content script to show/hide extension
    await chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_EXTENSION_STATE',
      isEnabled: newState
    });
  } catch (error) {
    console.log('Could not send message to tab:', error.message);
    // Silently fail - content script may not be ready yet
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_EXTENSION_STATE') {
    const state = extensionState.get(sender.tab.id) || false;
    sendResponse({ isEnabled: state });
    return true;
  }
});

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  extensionState.delete(tabId);
});

console.log('JobFlow background service worker initialized');
