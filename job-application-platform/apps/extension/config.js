// JobFlow Extension Configuration

// API Configuration
const API_CONFIG = {
  // Production URL
  BASE_URL: 'https://dusti.pro',

  // API Endpoints (for Phase 2 implementation)
  ENDPOINTS: {
    PROFILE: '/api/v1/profile',
    AUTH: '/api/v1/auth/check',
    SAVE_PATTERN: '/api/v1/patterns',
    GET_PATTERNS: '/api/v1/patterns',
    SAVE_RECORDING: '/api/v1/recordings'
  }
};

// Feature Flags
const FEATURES = {
  FORM_DETECTION: true,      // Phase 1: Detect forms ✅
  AUTOFILL: false,            // Phase 2: Autofill functionality ⏳
  LEARNING_MODE: true,        // Phase 1: Record user actions ✅
  AI_ANALYSIS: false,         // Phase 3: AI pattern analysis ⏳
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, FEATURES };
}
