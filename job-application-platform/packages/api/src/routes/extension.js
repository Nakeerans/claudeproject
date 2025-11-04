// Extension-specific API routes
// These endpoints are called by the Chrome extension

const express = require('express');
const router = express.Router();

// Mock user profile data for now (will connect to database later)
const mockProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  linkedinUrl: 'https://linkedin.com/in/johndoe',
  githubUrl: 'https://github.com/johndoe',
  websiteUrl: 'https://johndoe.com',
  resumeUrl: 'https://example.com/resume.pdf',
  yearsOfExperience: 5,
  currentJobTitle: 'Senior Software Engineer',
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL']
};

// GET /api/v1/extension/profile
// Returns user profile data for autofill
router.get('/profile', async (req, res) => {
  try {
    // TODO: Authenticate request from extension
    // TODO: Fetch actual user profile from database

    res.json({
      success: true,
      data: mockProfile,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// GET /api/v1/extension/pattern/:domain
// Returns automation pattern for a specific domain
router.get('/pattern/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    // TODO: Fetch pattern from database
    // TODO: Check if pattern exists for this domain

    res.json({
      success: true,
      data: {
        domain,
        pattern: null,
        message: 'No automation pattern found for this domain'
      }
    });
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pattern'
    });
  }
});

// POST /api/v1/extension/recording
// Save a new recording session
router.post('/recording', express.json(), async (req, res) => {
  try {
    const { url, domain, actions, sessionId } = req.body;

    if (!url || !domain || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, domain, actions'
      });
    }

    console.log(`📹 Recording saved for ${domain} (${actions.length} actions)`);

    // TODO: Save to database
    // TODO: Trigger AI analysis

    res.json({
      success: true,
      data: {
        recordingId: 'rec_' + Date.now(),
        actionsCount: actions.length,
        message: 'Recording saved successfully. AI analysis will begin shortly.'
      }
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save recording'
    });
  }
});

// POST /api/v1/extension/application
// Track a new job application
router.post('/application', express.json(), async (req, res) => {
  try {
    const { jobUrl, companyName, jobTitle, source } = req.body;

    console.log(`✅ Application tracked: ${jobTitle} at ${companyName}`);

    // TODO: Save to database
    // TODO: Extract job details
    // TODO: Update application tracker

    res.json({
      success: true,
      data: {
        applicationId: 'app_' + Date.now(),
        message: 'Application tracked successfully'
      }
    });
  } catch (error) {
    console.error('Error tracking application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track application'
    });
  }
});

// GET /api/v1/extension/status
// Check if user is authenticated and extension is working
router.get('/status', async (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: false, // TODO: Check actual auth
      profileComplete: true,
      patternsCount: 0,
      recordingsCount: 0,
      applicationsCount: 0
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
