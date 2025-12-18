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

  // Create the floating panel
  function createPanel() {
    if (panelContainer) return;

    panelContainer = document.createElement('div');
    panelContainer.id = 'jobflow-floating-panel';
    panelContainer.innerHTML = `
      <style>
        #jobflow-floating-panel {
          position: fixed;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: right 0.3s ease;
        }

        #jobflow-floating-panel.expanded {
          right: 0;
        }

        #jobflow-floating-panel.collapsed {
          right: -340px;
        }

        .jobflow-toggle-btn {
          position: absolute;
          left: -40px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }

        .jobflow-toggle-btn:hover {
          left: -42px;
          box-shadow: -4px 4px 12px rgba(0,0,0,0.3);
        }

        .jobflow-panel-content {
          width: 360px;
          height: 600px;
          max-height: 80vh;
          background: white;
          border-radius: 12px 0 0 12px;
          box-shadow: -4px 0 16px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .jobflow-panel-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          text-align: center;
        }

        .jobflow-panel-header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }

        .jobflow-panel-header p {
          margin: 4px 0 0 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .jobflow-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .jobflow-user-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #d1fae5;
          border-radius: 8px;
          margin-bottom: 12px;
          border-left: 3px solid #10b981;
        }

        .jobflow-user-name {
          font-size: 14px;
          font-weight: 600;
          color: #065f46;
        }

        .jobflow-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .jobflow-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .jobflow-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .jobflow-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .jobflow-btn-secondary {
          background: #f3f4f6;
          color: #333;
        }

        .jobflow-btn-secondary:hover {
          background: #e5e7eb;
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
          gap: 8px;
          padding: 10px 12px;
          background: #f0f9ff;
          border-radius: 8px;
          margin-bottom: 12px;
          border-left: 3px solid #667eea;
          font-size: 14px;
        }

        .jobflow-form-count {
          display: none;
          padding: 10px;
          background: #ecfdf5;
          border-radius: 6px;
          margin-bottom: 14px;
          font-size: 14px;
          color: #065f46;
          text-align: center;
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
          padding: 12px 0;
        }

        .jobflow-login-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .jobflow-login-title {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }

        .jobflow-login-subtitle {
          font-size: 13px;
          color: #666;
          margin-bottom: 16px;
          line-height: 1.5;
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
          <h1>⚡ JobFlow</h1>
          <p>Intelligent Application Assistant</p>
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

    // Toggle panel
    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      if (isExpanded) {
        panelContainer.classList.remove('collapsed');
        panelContainer.classList.add('expanded');
        if (isAuthenticated) {
          updateFormDetection();
        }
      } else {
        panelContainer.classList.remove('expanded');
        panelContainer.classList.add('collapsed');
      }
    });

    // Login button
    loginBtn.addEventListener('click', () => {
      window.open('https://dusti.pro/login', '_blank');
      document.getElementById('jobflow-login-instruction').style.display = 'block';
    });

    // Register link
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://dusti.pro/register', '_blank');
    });

    // Logout button
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('https://dusti.pro/api/auth/logout', {
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

    // Initialize collapsed
    panelContainer.classList.add('collapsed');
    checkAuthentication();
  }

  // Check authentication
  async function checkAuthentication() {
    try {
      const authStatus = await window.JobFlowAPI.checkAuth();

      if (authStatus) {
        isAuthenticated = true;

        const authResponse = await fetch('https://dusti.pro/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        });

        if (authResponse.ok) {
          const data = await authResponse.json();
          currentUser = data.user;
          document.getElementById('jobflow-user-name').textContent =
            currentUser?.name || currentUser?.email || 'User';
        }

        showMainPage();
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

  // Get auth token
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
    if (message.type === 'TOGGLE_FLOATING_PANEL') {
      if (!panelContainer) {
        createPanel();
      }
      // Trigger toggle
      document.getElementById('jobflow-toggle').click();
    }
  });

  // Create panel on load
  createPanel();
})();
