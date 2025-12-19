// JobFlow Extension - Authentication Listener
// This script runs ONLY on dusti.pro pages to capture login tokens

(function() {
  'use strict';

  // Only run on dusti.pro
  if (!window.location.hostname.includes('dusti.pro')) {
    return;
  }

  console.log('JobFlow Auth Listener: Running on dusti.pro');

  // Listen for messages from the web page
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) {
      return;
    }

    // Check if this is a JobFlow auth token message
    if (event.data && event.data.type === 'JOBFLOW_AUTH_TOKEN') {
      console.log('JobFlow Auth Listener: Received auth token');

      const { token, user } = event.data;

      // Store token in chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          jobflow_auth_token: token,
          jobflow_user_data: user
        }, () => {
          console.log('JobFlow Auth Listener: Token stored successfully');

          // Send confirmation back to the page
          window.postMessage({
            type: 'JOBFLOW_AUTH_TOKEN_STORED',
            success: true
          }, window.location.origin);
        });
      }
    }
  });

  console.log('JobFlow Auth Listener: Ready to receive auth tokens');
})();
