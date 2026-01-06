// JobFlow Extension - API Client

// API Configuration
// For local development, change this to 'http://localhost:3001'
// For production, use 'https://dusti.pro'
const API_BASE_URL = 'https://dusti.pro';

// Storage key for auth token
const AUTH_TOKEN_KEY = 'jobflow_auth_token';
const USER_DATA_KEY = 'jobflow_user_data';

/**
 * Get authentication token from chrome.storage
 * @returns {Promise<string|null>} - Token value or null
 */
async function getAuthToken() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([AUTH_TOKEN_KEY], (result) => {
          resolve(result[AUTH_TOKEN_KEY] || null);
        });
      });
    }
    console.log('JobFlow: chrome.storage not available');
    return null;
  } catch (error) {
    console.log('JobFlow: Could not access storage API:', error);
    return null;
  }
}

/**
 * Store authentication token in chrome.storage
 * @param {string} token - Auth token to store
 * @returns {Promise<void>}
 */
async function setAuthToken(token) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [AUTH_TOKEN_KEY]: token }, () => {
          console.log('JobFlow: Token stored successfully');
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('JobFlow: Could not store token:', error);
  }
}

/**
 * Remove authentication token from chrome.storage
 * @returns {Promise<void>}
 */
async function removeAuthToken() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([AUTH_TOKEN_KEY, USER_DATA_KEY], () => {
          console.log('JobFlow: Token removed successfully');
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('JobFlow: Could not remove token:', error);
  }
}

/**
 * Make an authenticated API request via background script to avoid CORS
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from chrome.storage
  const token = await getAuthToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    mode: 'cors'
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Use background script as proxy to avoid CORS issues
  // Content scripts inherit page origin, but background scripts use chrome-extension://
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'API_REQUEST',
          url: url,
          options: finalOptions
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'API request failed'));
          }
        }
      );
    });
  } else {
    // Fallback to direct fetch if chrome.runtime not available
    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Get user's autofill profile
 * @returns {Promise<object>} - User profile data
 */
async function getProfile() {
  return apiRequest('/api/v1/profile');
}

/**
 * Update user's autofill profile
 * @param {object} profileData - Profile fields to update
 * @returns {Promise<object>} - Updated profile data
 */
async function updateProfile(profileData) {
  return apiRequest('/api/v1/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
}

/**
 * Get autofill patterns for a specific URL
 * @param {string} url - Site URL to get patterns for
 * @returns {Promise<object>} - Patterns data
 */
async function getPatterns(url) {
  const params = url ? `?url=${encodeURIComponent(url)}` : '';
  return apiRequest(`/api/v1/patterns${params}`);
}

/**
 * Save a new autofill pattern from learning mode
 * @param {object} patternData - Pattern data (siteUrl, actions, fieldMappings)
 * @returns {Promise<object>} - Saved pattern data
 */
async function savePattern(patternData) {
  return apiRequest('/api/v1/patterns', {
    method: 'POST',
    body: JSON.stringify(patternData)
  });
}

/**
 * Update pattern usage statistics
 * @param {string} patternId - Pattern ID
 * @param {boolean} success - Whether autofill was successful
 * @returns {Promise<object>} - Updated stats
 */
async function updatePatternStats(patternId, success) {
  return apiRequest(`/api/v1/patterns/${patternId}/stats`, {
    method: 'PUT',
    body: JSON.stringify({ success })
  });
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} - Authentication status
 */
async function checkAuth() {
  try {
    const response = await apiRequest('/api/v1/auth/check');
    return response.authenticated === true;
  } catch (error) {
    return false;
  }
}

/**
 * Send job information to backend for AI parsing and processing
 * @param {object} jobData - Raw job information extracted from page
 * @returns {Promise<object>} - AI-parsed and structured job data
 */
async function parseJobWithAI(jobData) {
  return apiRequest('/api/v1/ai/jobs/parse', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
}

/**
 * Save analyzed job posting for tracking and resume tailoring
 * @param {object} jobData - Parsed job information
 * @returns {Promise<object>} - Saved job posting data
 */
async function saveJobPosting(jobData) {
  return apiRequest('/api/v1/applications', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
}

/**
 * Get AI-tailored resume for a specific job
 * @param {string} jobId - Job posting ID
 * @returns {Promise<object>} - Tailored resume data
 */
async function getTailoredResume(jobId) {
  return apiRequest(`/api/v1/applications/${jobId}/tailor-resume`);
}

// Export API functions
if (typeof window !== 'undefined') {
  window.JobFlowAPI = {
    getProfile,
    updateProfile,
    getPatterns,
    savePattern,
    updatePatternStats,
    checkAuth,
    setAuthToken,
    removeAuthToken,
    getAuthToken,
    parseJobWithAI,
    saveJobPosting,
    getTailoredResume,
    apiRequest // Expose for direct API calls
  };
}
