// JobFlow Extension - Side Panel Script

document.addEventListener('DOMContentLoaded', async () => {
  // Get references to UI elements
  const loginPage = document.getElementById('login-page');
  const mainPage = document.getElementById('main-page');
  const autofillBtn = document.getElementById('autofill-btn');
  const recordBtn = document.getElementById('record-btn');
  const formCountDiv = document.getElementById('form-count');
  const openWebappLink = document.getElementById('open-webapp');
  const loginBtn = document.getElementById('login-btn');
  const registerLink = document.getElementById('register-link');
  const logoutBtn = document.getElementById('logout-btn');
  const userNameSpan = document.getElementById('user-name');

  // State
  let isAuthenticated = false;
  let currentUser = null;
  let currentTab = null;

  // Page navigation functions
  function showLoginPage() {
    loginPage.classList.add('active');
    mainPage.classList.remove('active');
  }

  function showMainPage() {
    loginPage.classList.remove('active');
    mainPage.classList.add('active');
  }

  // Check authentication status
  async function checkAuthentication() {
    try {
      const authStatus = await window.JobFlowAPI.checkAuth();

      if (authStatus) {
        // User is logged in
        isAuthenticated = true;

        // Get user info from auth check response
        const authResponse = await fetch('https://dusti.pro/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        });

        if (authResponse.ok) {
          const data = await authResponse.json();
          currentUser = data.user;
          userNameSpan.textContent = currentUser?.name || currentUser?.email || 'User';
        } else {
          userNameSpan.textContent = 'User';
        }

        showMainPage();
        // Update form detection for current tab
        updateFormDetection();
      } else {
        isAuthenticated = false;
        showLoginPage();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      isAuthenticated = false;
      showLoginPage();
    }
  }

  // Helper to get auth token from cookie
  async function getAuthToken() {
    try {
      const cookie = await chrome.cookies.get({
        url: 'https://dusti.pro',
        name: 'token'
      });
      return cookie ? cookie.value : null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Update form detection for current tab
  async function updateFormDetection() {
    if (!isAuthenticated) return;

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;

      // Check if we're on a valid page (not chrome:// or extension://)
      if (!tab.url.startsWith('http')) {
        formCountDiv.textContent = '⚠️  Not a valid web page';
        formCountDiv.className = 'visible';
        formCountDiv.style.background = '#fee2e2';
        formCountDiv.style.color = '#991b1b';
        autofillBtn.disabled = true;
        recordBtn.disabled = true;
        return;
      }

      // Query content script for form data
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_FORM_DATA' });

        if (response && response.formsDetected > 0) {
          formCountDiv.textContent = `📝 Found ${response.formsDetected} application form(s)`;
          formCountDiv.className = 'visible';
          formCountDiv.style.background = '#ecfdf5';
          formCountDiv.style.color = '#065f46';
          autofillBtn.disabled = false;
          recordBtn.disabled = false;
        } else {
          formCountDiv.textContent = 'ℹ️  No application forms detected';
          formCountDiv.className = 'visible';
          formCountDiv.style.background = '#f3f4f6';
          formCountDiv.style.color = '#666';
          autofillBtn.disabled = false;
          recordBtn.disabled = false;
        }
      } catch (error) {
        console.log('Could not connect to content script:', error);
        formCountDiv.textContent = 'ℹ️  Refresh page to detect forms';
        formCountDiv.className = 'visible';
        autofillBtn.disabled = false;
        recordBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error updating form detection:', error);
    }
  }

  // Login button click
  loginBtn.addEventListener('click', () => {
    // Open web app login page
    chrome.tabs.create({ url: 'https://dusti.pro/login' });

    // Show instruction message
    const instructionDiv = document.getElementById('login-instruction');
    if (instructionDiv) {
      instructionDiv.style.display = 'block';
    }
  });

  // Register link click
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://dusti.pro/register' });
  });

  // Logout button click
  logoutBtn.addEventListener('click', async () => {
    try {
      // Call logout API
      await fetch('https://dusti.pro/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      isAuthenticated = false;
      currentUser = null;
      showLoginPage();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  });

  // Check auth on load
  await checkAuthentication();

  // Listen for cookie changes to detect login/logout
  if (chrome.cookies && chrome.cookies.onChanged) {
    chrome.cookies.onChanged.addListener((changeInfo) => {
      // If the auth token cookie changed, re-check authentication
      if (changeInfo.cookie.name === 'token' && changeInfo.cookie.domain.includes('dusti.pro')) {
        checkAuthentication();
      }
    });
  }

  // Listen for tab updates to refresh form detection
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (isAuthenticated) {
      await updateFormDetection();
    }
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (isAuthenticated && changeInfo.status === 'complete' && tab.active) {
      await updateFormDetection();
    }
  });

  // Autofill button click
  autofillBtn.addEventListener('click', async () => {
    if (!isAuthenticated) {
      alert('Please log in first to use autofill!');
      return;
    }

    if (!currentTab) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
    }

    autofillBtn.disabled = true;
    autofillBtn.textContent = '⏳ Autofilling...';

    try {
      // 1. Get user profile from API
      const profileData = await window.JobFlowAPI.getProfile();

      // 2. Get learned patterns for this site
      const patterns = await window.JobFlowAPI.getPatterns(currentTab.url);

      // 3. Send autofill command to content script with profile data
      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'AUTOFILL',
        profile: profileData,
        patterns: patterns
      });

      autofillBtn.textContent = '✓ Autofilled!';
      setTimeout(() => {
        autofillBtn.textContent = 'Autofill Current Page';
        autofillBtn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Autofill error:', error);
      alert(
        `Autofill failed: ${error.message}\n\n` +
        'Make sure you have:\n' +
        '1. Completed your profile in Settings\n' +
        '2. Refreshed this page after logging in'
      );
      autofillBtn.textContent = 'Autofill Current Page';
      autofillBtn.disabled = false;
    }
  });

  // Record button click
  recordBtn.addEventListener('click', async () => {
    if (!currentTab) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
    }

    if (recordBtn.textContent.includes('Start')) {
      // Start recording
      recordBtn.textContent = '⏹️  Stop Learning Mode';
      recordBtn.style.background = '#fef2f2';
      recordBtn.style.color = '#991b1b';

      try {
        await chrome.tabs.sendMessage(currentTab.id, { type: 'START_RECORDING' });
      } catch (error) {
        console.error('Could not start recording:', error);
      }
    } else {
      // Stop recording
      recordBtn.textContent = '📊 Processing...';
      recordBtn.disabled = true;

      try {
        const response = await chrome.tabs.sendMessage(currentTab.id, { type: 'STOP_RECORDING' });

        // Save pattern to backend
        try {
          const result = await window.JobFlowAPI.savePattern({
            siteUrl: currentTab.url,
            siteName: new URL(currentTab.url).hostname,
            actions: response.actions,
            fieldMappings: response.fieldMappings || []
          });

          alert(
            `✅ Pattern Saved!\n\n` +
            `Captured ${response.actions.length} actions from ${result.pattern.siteName}\n\n` +
            `This pattern will be used for autofill on similar pages.`
          );
        } catch (apiError) {
          console.error('Error saving pattern:', apiError);
          alert(
            `⚠️ Pattern Recorded But Not Saved\n\n` +
            `Captured ${response.actions.length} actions\n\n` +
            `Error: ${apiError.message}\n` +
            `Please make sure you're logged in to the web app.`
          );
        }

        recordBtn.textContent = 'Start Learning Mode';
        recordBtn.style.background = '#f3f4f6';
        recordBtn.style.color = '#333';
        recordBtn.disabled = false;
      } catch (error) {
        console.error('Could not stop recording:', error);
        recordBtn.textContent = 'Start Learning Mode';
        recordBtn.disabled = false;
      }
    }
  });

  // Open web app link
  openWebappLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Open the deployed web app
    chrome.tabs.create({ url: 'https://dusti.pro' });
  });
});
