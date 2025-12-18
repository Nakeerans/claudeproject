// JobFlow Extension - Background Service Worker

// Toggle floating panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Send message to content script to toggle floating panel
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FLOATING_PANEL' });
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
