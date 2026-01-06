// JobFlow Extension - Authentication Listener
// This script runs ONLY on dusti.pro pages to capture login tokens

(function() {
  'use strict';

  // Only run on dusti.pro (including localhost for development)
  const hostname = window.location.hostname;
  if (!hostname.includes('dusti.pro') && !hostname.includes('localhost')) {
    return;
  }

  console.log('JobFlow Auth Listener: Running on', hostname);

  // Listen for messages from the web page
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) {
      console.log('JobFlow Auth Listener: Rejected message from different origin:', event.origin);
      return;
    }

    // Check if this is a JobFlow auth token message
    if (event.data && event.data.type === 'JOBFLOW_AUTH_TOKEN') {
      console.log('JobFlow Auth Listener: Received auth token!', event.data);

      const { token, user } = event.data;

      // Store token in chrome.storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          jobflow_auth_token: token,
          jobflow_user_data: user
        }, () => {
          console.log('JobFlow Auth Listener: Token stored successfully in chrome.storage');
          console.log('JobFlow Auth Listener: Stored data:', { token: token.substring(0, 20) + '...', user });

          // Send confirmation back to the page
          window.postMessage({
            type: 'JOBFLOW_AUTH_TOKEN_STORED',
            success: true
          }, window.location.origin);
        });
      } else {
        console.error('JobFlow Auth Listener: chrome.storage not available!');
      }
    }
  });

  console.log('JobFlow Auth Listener: Ready to receive auth tokens');

  // Also check if there's a token in localStorage and sync it to chrome.storage
  // This handles the case where user is already logged in
  setTimeout(() => {
    const localStorageToken = localStorage.getItem('token');
    if (localStorageToken) {
      console.log('JobFlow Auth Listener: Found token in localStorage, syncing to chrome.storage');

      // Verify token is valid by checking with backend
      fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorageToken}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Token invalid');
      })
      .then(data => {
        // Token is valid, store it
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            jobflow_auth_token: localStorageToken,
            jobflow_user_data: data.user
          }, () => {
            console.log('JobFlow Auth Listener: Synced localStorage token to chrome.storage');
          });
        }
      })
      .catch(error => {
        console.log('JobFlow Auth Listener: Token in localStorage is invalid:', error);
      });
    }
  }, 1000); // Wait 1 second for page to fully load
})();
