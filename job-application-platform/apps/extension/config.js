// JobFlow Extension Configuration

// API Configuration
const API_CONFIG = {
  // Production URL
  BASE_URL: 'https://dusti.pro',

  // API Endpoints (for Phase 2 implementation)
  ENDPOINTS: {
    PROFILE: '/api/profile',
    AUTH: '/api/auth/check',
    SAVE_PATTERN: '/api/patterns',
    GET_PATTERNS: '/api/patterns',
    SAVE_RECORDING: '/api/recordings'
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
