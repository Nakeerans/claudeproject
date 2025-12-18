// JobFlow Extension - Background Service Worker

// Toggle floating panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Check if tab URL is valid for content scripts
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
    console.log('Cannot inject content script into this page');
    return;
  }

  try {
    // Send message to content script to toggle floating panel
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FLOATING_PANEL' });
  } catch (error) {
    console.log('Could not send message to tab:', error.message);
    // Silently fail - content script may not be ready yet
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_FLOATING_PANEL') {
    chrome.tabs.sendMessage(sender.tab.id, { type: 'TOGGLE_FLOATING_PANEL' })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

console.log('JobFlow background service worker initialized');
