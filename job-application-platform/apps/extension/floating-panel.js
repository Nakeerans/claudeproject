// JobFlow Extension - Floating Panel Component

(function() {
  'use strict';

  // Prevent multiple instances
  if (window.jobflowPanelLoaded) return;
  window.jobflowPanelLoaded = true;

  let panelContainer = null;
  let isExpanded = false;
  let isAuthenticated = false;
  let currentUser = null;
  let isExtensionActive = false; // Extension on/off state

  // Create the floating panel
  function createPanel(startHidden = false) {
    if (panelContainer) return;

    panelContainer = document.createElement('div');
    panelContainer.id = 'jobflow-floating-panel';

    // Start hidden if specified
    if (startHidden) {
      panelContainer.style.display = 'none';
    }
    panelContainer.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

        #jobflow-floating-panel {
          position: fixed;
          z-index: 2147483647;
          font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .jobflow-toggle-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #551BA4 0%, #46346B 100%);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          box-shadow: 0px 4px 20px rgba(85, 27, 164, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 2147483647;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .jobflow-toggle-btn:hover {
          transform: scale(1.1);
          box-shadow: 0px 6px 30px rgba(85, 27, 164, 0.6);
          background: linear-gradient(135deg, #6a4feb 0%, #551BA4 100%);
        }

        .jobflow-toggle-btn:active {
          transform: scale(0.95);
        }

        #jobflow-floating-panel.expanded .jobflow-toggle-btn {
          bottom: auto;
          top: 30px;
          right: 30px;
          width: 40px;
          height: 40px;
          font-size: 20px;
          box-shadow: 0px 2px 10px rgba(0,0,0,0.3);
        }

        .jobflow-panel-content {
          position: fixed;
          top: 30px;
          right: 30px;
          width: 380px;
          height: 90vh;
          max-height: 650px;
          background: white;
          border-radius: 8px;
          box-shadow: 0px 0px 40px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        #jobflow-floating-panel.expanded .jobflow-panel-content {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }

        .jobflow-panel-header {
          background: linear-gradient(135deg, #551BA4 0%, #46346B 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }

        .jobflow-panel-header h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 5px;
        }

        .jobflow-panel-header p {
          margin: 8px 0 0 0;
          font-size: 11px;
          opacity: 0.8;
          font-weight: 300;
          letter-spacing: 1px;
        }

        .jobflow-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #fafafa;
        }

        .jobflow-panel-body::-webkit-scrollbar {
          width: 6px;
        }

        .jobflow-panel-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .jobflow-panel-body::-webkit-scrollbar-thumb {
          background: #551BA4;
          border-radius: 3px;
        }

        .jobflow-panel-body::-webkit-scrollbar-thumb:hover {
          background: #46346B;
        }

        .jobflow-user-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: white;
          border-radius: 6px;
          margin-bottom: 14px;
          border-left: 4px solid #551BA4;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }

        .jobflow-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #4A4A4A;
        }

        .jobflow-btn {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 10px;
          font-family: 'Lato', sans-serif;
          letter-spacing: 0.5px;
        }

        .jobflow-btn-primary {
          background: #551BA4;
          color: white;
          box-shadow: 0 2px 8px rgba(85, 27, 164, 0.2);
        }

        .jobflow-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(85, 27, 164, 0.4);
          background: #6a4feb;
        }

        .jobflow-btn-primary:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(85, 27, 164, 0.2);
        }

        .jobflow-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .jobflow-btn-secondary {
          background: #f3f4f6;
          color: #4A4A4A;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }

        .jobflow-btn-secondary:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .jobflow-btn-small {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          background: #fee2e2;
          color: #991b1b;
        }

        .jobflow-btn-small:hover {
          background: #fecaca;
        }

        .jobflow-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: white;
          border-radius: 6px;
          margin-bottom: 14px;
          border-left: 4px solid #10b981;
          font-size: 14px;
          font-weight: 500;
          color: #065f46;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }

        .jobflow-form-count {
          display: none;
          padding: 12px 16px;
          background: white;
          border-radius: 6px;
          margin-bottom: 14px;
          font-size: 14px;
          color: #065f46;
          text-align: center;
          font-weight: 500;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          border-left: 4px solid #10b981;
        }

        .jobflow-form-count.visible {
          display: block;
        }

        .jobflow-info {
          font-size: 12px;
          color: #666;
          text-align: center;
          margin-top: 12px;
          line-height: 1.5;
        }

        .jobflow-login-container {
          text-align: center;
          padding: 20px 0;
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .jobflow-login-icon {
          font-size: 72px;
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 8px rgba(85, 27, 164, 0.2));
        }

        .jobflow-login-title {
          font-size: 18px;
          font-weight: 700;
          color: #4A4A4A;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }

        .jobflow-login-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.6;
          font-weight: 400;
        }

        .jobflow-feature-list {
          text-align: left;
          margin: 16px 0;
        }

        .jobflow-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 13px;
          color: #555;
        }

        .jobflow-feature-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .jobflow-page-view {
          display: none;
        }

        .jobflow-page-view.active {
          display: block;
        }

        #jobflow-login-instruction {
          display: none;
          margin-top: 12px;
          padding: 10px;
          background: #e0f2fe;
          border-radius: 6px;
          font-size: 11px;
          color: #0369a1;
          line-height: 1.5;
        }
      </style>

      <button class="jobflow-toggle-btn" id="jobflow-toggle">
        ⚡
      </button>

      <div class="jobflow-panel-content">
        <div class="jobflow-panel-header">
          <h1>JOBFLOW</h1>
          <p>Your Intelligent Job Application Assistant</p>
        </div>

        <div class="jobflow-panel-body">
          <!-- LOGIN PAGE -->
          <div id="jobflow-login-page" class="jobflow-page-view">
            <div class="jobflow-login-container">
              <div class="jobflow-login-icon">🔐</div>
              <h2 class="jobflow-login-title">Welcome to JobFlow</h2>
              <p class="jobflow-login-subtitle">
                Sign in to unlock powerful autofill features
              </p>

              <div class="jobflow-feature-list">
                <div class="jobflow-feature-item">
                  <span class="jobflow-feature-icon">✨</span>
                  <span>One-click autofill for job applications</span>
                </div>
                <div class="jobflow-feature-item">
                  <span class="jobflow-feature-icon">🎯</span>
                  <span>Smart form detection</span>
                </div>
                <div class="jobflow-feature-item">
                  <span class="jobflow-feature-icon">📊</span>
                  <span>Track all applications</span>
                </div>
                <div class="jobflow-feature-item">
                  <span class="jobflow-feature-icon">🔒</span>
                  <span>Secure and private</span>
                </div>
              </div>

              <button id="jobflow-login-btn" class="jobflow-btn jobflow-btn-primary">
                Log In to JobFlow
              </button>

              <div id="jobflow-login-instruction">
                ✓ Login page opened! After logging in, this panel will automatically update.
              </div>

              <div class="jobflow-info" style="margin-top: 12px; font-size: 11px;">
                Don't have an account?
                <a href="#" id="jobflow-register-link" style="color: #667eea; font-weight: 600;">Sign up</a>
              </div>
            </div>
          </div>

          <!-- MAIN PAGE -->
          <div id="jobflow-main-page" class="jobflow-page-view">
            <div class="jobflow-user-header">
              <div>
                <div style="font-size: 11px; color: #059669; margin-bottom: 2px;">Logged in as</div>
                <span class="jobflow-user-name" id="jobflow-user-name">Loading...</span>
              </div>
              <button id="jobflow-logout-btn" class="jobflow-btn-small">
                Logout
              </button>
            </div>

            <div class="jobflow-status">
              <span>✅</span>
              <span>Extension Active</span>
            </div>

            <div id="jobflow-form-count" class="jobflow-form-count"></div>

            <button id="jobflow-autofill-btn" class="jobflow-btn jobflow-btn-primary">
              Autofill Current Page
            </button>

            <button id="jobflow-record-btn" class="jobflow-btn jobflow-btn-secondary">
              Start Learning Mode
            </button>

            <div class="jobflow-info">
              Visit a job application page to start autofilling
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panelContainer);
    console.log('JobFlow: Panel container added to page');

    initializePanel();
  }

  // Initialize panel functionality
  function initializePanel() {
    const toggleBtn = document.getElementById('jobflow-toggle');
    const loginBtn = document.getElementById('jobflow-login-btn');
    const registerLink = document.getElementById('jobflow-register-link');
    const logoutBtn = document.getElementById('jobflow-logout-btn');
    const autofillBtn = document.getElementById('jobflow-autofill-btn');
    const recordBtn = document.getElementById('jobflow-record-btn');

    // Toggle panel expand/collapse (when floating button on page is clicked)
    toggleBtn.addEventListener('click', () => {
      if (isExpanded) {
        // Collapse panel (show only button)
        isExpanded = false;
        panelContainer.classList.remove('expanded');
        panelContainer.classList.add('collapsed');
      } else {
        // Expand panel
        isExpanded = true;
        panelContainer.classList.remove('collapsed');
        panelContainer.classList.add('expanded');
        if (isAuthenticated) {
          updateFormDetection();
        }
      }
    });

    // Login button
    loginBtn.addEventListener('click', async () => {
      // Open login page in new tab
      const loginTab = window.open('https://dusti.pro/login?extensionLogin=true', '_blank');
      document.getElementById('jobflow-login-instruction').style.display = 'block';

      // Start polling for authentication
      const pollInterval = setInterval(async () => {
        try {
          const authStatus = await window.JobFlowAPI.checkAuth();
          if (authStatus) {
            clearInterval(pollInterval);
            document.getElementById('jobflow-login-instruction').textContent = '✓ Login successful! Refreshing...';

            // Re-check authentication to get user data
            await checkAuthentication();

            if (loginTab && !loginTab.closed) {
              loginTab.close();
            }
          }
        } catch (error) {
          // Ignore errors during polling
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        document.getElementById('jobflow-login-instruction').style.display = 'none';
      }, 5 * 60 * 1000);
    });

    // Register link
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://dusti.pro/register', '_blank');
    });

    // Logout button
    logoutBtn.addEventListener('click', async () => {
      try {
        // Remove token from storage
        await window.JobFlowAPI.removeAuthToken();

        // Clear server-side session
        await fetch('https://dusti.pro/api/auth/logout', {
          method: 'POST',
          mode: 'cors'
        });

        isAuthenticated = false;
        currentUser = null;
        showLoginPage();
        console.log('JobFlow: Logged out successfully');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    });

    // Autofill button
    autofillBtn.addEventListener('click', async () => {
      if (!isAuthenticated) {
        alert('Please log in first to use autofill!');
        return;
      }

      autofillBtn.disabled = true;
      autofillBtn.textContent = '⏳ Autofilling...';

      try {
        const profileData = await window.JobFlowAPI.getProfile();
        const patterns = await window.JobFlowAPI.getPatterns(window.location.href);

        // Send message to content script for autofill
        window.postMessage({
          type: 'JOBFLOW_AUTOFILL',
          profile: profileData,
          patterns: patterns
        }, '*');

        autofillBtn.textContent = '✓ Autofilled!';
        setTimeout(() => {
          autofillBtn.textContent = 'Autofill Current Page';
          autofillBtn.disabled = false;
        }, 2000);
      } catch (error) {
        console.error('Autofill error:', error);
        alert(`Autofill failed: ${error.message}`);
        autofillBtn.textContent = 'Autofill Current Page';
        autofillBtn.disabled = false;
      }
    });

    // Record button
    recordBtn.addEventListener('click', async () => {
      if (recordBtn.textContent.includes('Start')) {
        recordBtn.textContent = '⏹️  Stop Learning Mode';
        recordBtn.style.background = '#fef2f2';
        recordBtn.style.color = '#991b1b';

        window.postMessage({ type: 'JOBFLOW_START_RECORDING' }, '*');
      } else {
        recordBtn.textContent = '📊 Processing...';
        recordBtn.disabled = true;

        window.postMessage({ type: 'JOBFLOW_STOP_RECORDING' }, '*');
      }
    });

    // Initialize - start hidden, wait for extension icon click
    isExtensionActive = false;
    isExpanded = false;
    checkAuthentication();
  }

  // Check authentication
  async function checkAuthentication() {
    console.log('JobFlow: Checking authentication...');
    try {
      const token = await window.JobFlowAPI.getAuthToken();
      console.log('JobFlow: Token exists:', !!token);

      if (!token) {
        console.log('JobFlow: No token found');
        isAuthenticated = false;
        showLoginPage();
        return;
      }

      // Verify token is valid by calling /api/auth/check
      const authStatus = await window.JobFlowAPI.checkAuth();
      console.log('JobFlow: Auth status:', authStatus);

      if (authStatus) {
        isAuthenticated = true;

        // Get user data
        const authResponse = await window.JobFlowAPI.apiRequest('/api/auth/me');
        currentUser = authResponse.user;
        console.log('JobFlow: User authenticated:', currentUser?.email);
        document.getElementById('jobflow-user-name').textContent =
          currentUser?.name || currentUser?.email || 'User';

        showMainPage();
      } else {
        console.log('JobFlow: Token invalid');
        // Remove invalid token
        await window.JobFlowAPI.removeAuthToken();
        isAuthenticated = false;
        showLoginPage();
      }
    } catch (error) {
      console.error('JobFlow: Auth check failed:', error);
      isAuthenticated = false;
      showLoginPage();
    }
  }

  // Show login page
  function showLoginPage() {
    document.getElementById('jobflow-login-page').classList.add('active');
    document.getElementById('jobflow-main-page').classList.remove('active');
  }

  // Show main page
  function showMainPage() {
    document.getElementById('jobflow-login-page').classList.remove('active');
    document.getElementById('jobflow-main-page').classList.add('active');
  }

  // Update form detection
  function updateFormDetection() {
    const formCountDiv = document.getElementById('jobflow-form-count');
    const forms = document.querySelectorAll('form');

    if (forms.length > 0) {
      formCountDiv.textContent = `📝 Found ${forms.length} form(s) on this page`;
      formCountDiv.className = 'jobflow-form-count visible';
      formCountDiv.style.background = '#ecfdf5';
      formCountDiv.style.color = '#065f46';
    } else {
      formCountDiv.textContent = 'ℹ️  No forms detected on this page';
      formCountDiv.className = 'jobflow-form-count visible';
      formCountDiv.style.background = '#f3f4f6';
      formCountDiv.style.color = '#666';
    }
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.type === 'TOGGLE_EXTENSION_STATE') {
        isExtensionActive = message.isEnabled;

        if (isExtensionActive) {
          // Extension turned ON - create panel if not exists and show button
          if (!panelContainer) {
            createPanel(false); // Create panel (not hidden)
          }

          console.log('JobFlow: Extension turned ON');
          panelContainer.style.display = 'block';
          panelContainer.classList.remove('expanded');
          panelContainer.classList.add('collapsed');
          isExpanded = false;
        } else {
          // Extension turned OFF - hide everything
          if (panelContainer) {
            console.log('JobFlow: Extension turned OFF');
            panelContainer.style.display = 'none';
            panelContainer.classList.remove('expanded', 'collapsed');
            isExpanded = false;
          }
        }
      }
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open
  });

  // Don't create panel automatically - wait for extension icon click
  console.log('JobFlow: Floating panel script loaded and ready');
})();
