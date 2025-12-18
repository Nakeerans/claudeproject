// JobFlow Extension - Background Service Worker

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel for the current window
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Optional: Auto-open side panel on certain pages (job application sites)
// Uncomment and customize if you want this feature
/*
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // List of job sites where we want to auto-open the side panel
    const jobSites = [
      'linkedin.com/jobs',
      'indeed.com',
      'glassdoor.com',
      'monster.com',
      'ziprecruiter.com',
      'greenhouse.io',
      'lever.co',
      'workday.com'
    ];

    // Check if current URL matches any job site
    const isJobSite = jobSites.some(site => tab.url.includes(site));

    if (isJobSite) {
      // Auto-open side panel on job application sites
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});
*/

// Listen for messages from content scripts or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ windowId: sender.tab.windowId })
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

console.log('JobFlow background service worker initialized');
