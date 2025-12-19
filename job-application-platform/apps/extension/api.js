// JobFlow Extension - API Client

// API Configuration
// For local development, change this to 'http://localhost:3001'
// For production, use 'https://dusti.pro'
const API_BASE_URL = 'https://dusti.pro';

/**
 * Get authentication token from cookies (via background script)
 * @returns {Promise<string|null>} - Token value or null
 */
async function getAuthToken() {
  try {
    // Check if chrome.cookies exists and is available
    if (typeof chrome !== 'undefined' && chrome.cookies && typeof chrome.cookies.get === 'function') {
      const cookie = await chrome.cookies.get({
        url: API_BASE_URL,
        name: 'token'
      });
      return cookie ? cookie.value : null;
    }
    // In content script context, chrome.cookies is not available
    // Return null and rely on credentials: 'include'
    console.log('JobFlow: chrome.cookies not available, using credentials mode');
    return null;
  } catch (error) {
    console.log('JobFlow: Could not access cookies API, using credentials mode');
    return null;
  }
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Try to get token from cookie (works in background/popup, not content script)
  const token = await getAuthToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    credentials: 'include', // Send cookies automatically
    mode: 'cors' // Allow cross-origin requests
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get user's autofill profile
 * @returns {Promise<object>} - User profile data
 */
async function getProfile() {
  return apiRequest('/api/profile');
}

/**
 * Update user's autofill profile
 * @param {object} profileData - Profile fields to update
 * @returns {Promise<object>} - Updated profile data
 */
async function updateProfile(profileData) {
  return apiRequest('/api/profile', {
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
  return apiRequest(`/api/patterns${params}`);
}

/**
 * Save a new autofill pattern from learning mode
 * @param {object} patternData - Pattern data (siteUrl, actions, fieldMappings)
 * @returns {Promise<object>} - Saved pattern data
 */
async function savePattern(patternData) {
  return apiRequest('/api/patterns', {
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
  return apiRequest(`/api/patterns/${patternId}/stats`, {
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
    const response = await apiRequest('/api/auth/check');
    return response.authenticated === true;
  } catch (error) {
    return false;
  }
}

// Export API functions
if (typeof window !== 'undefined') {
  window.JobFlowAPI = {
    getProfile,
    updateProfile,
    getPatterns,
    savePattern,
    updatePatternStats,
    checkAuth
  };
}
