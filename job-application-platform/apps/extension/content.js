// JobFlow Chrome Extension - Content Script
// Detects job application forms and provides autofill functionality

console.log('🚀 JobFlow extension loaded');

// State
let detectedForms = [];
let isRecording = false;
let recordedActions = [];

// Initialize on page load
(function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectForms);
  } else {
    detectForms();
  }

  // Watch for dynamic content (SPAs)
  observeDOMChanges();
})();

/**
 * Detect job application forms on the page
 */
function detectForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    // Check if form looks like a job application
    if (isJobApplicationForm(form)) {
      console.log('📝 Job application form detected!', form);

      // Store detected form
      detectedForms.push({
        form,
        fields: analyzeFormFields(form),
        detectedAt: new Date()
      });

      // Add autofill button
      addAutofillButton(form);
    }
  });

  console.log(`Found ${detectedForms.length} job application form(s)`);
}

/**
 * Check if a form is likely a job application
 */
function isJobApplicationForm(form) {
  const inputs = form.querySelectorAll('input, textarea, select');

  // Look for common job application fields
  const hasEmail = Array.from(inputs).some(input =>
    input.type === 'email' ||
    input.name?.toLowerCase().includes('email') ||
    input.placeholder?.toLowerCase().includes('email')
  );

  const hasFileUpload = Array.from(inputs).some(input =>
    input.type === 'file' ||
    input.accept?.includes('pdf') ||
    input.accept?.includes('doc')
  );

  const hasName = Array.from(inputs).some(input =>
    input.name?.toLowerCase().includes('name') ||
    input.placeholder?.toLowerCase().includes('name')
  );

  const hasPhone = Array.from(inputs).some(input =>
    input.type === 'tel' ||
    input.name?.toLowerCase().includes('phone') ||
    input.placeholder?.toLowerCase().includes('phone')
  );

  // Heuristic: likely a job application if it has email + (file upload OR name+phone)
  return hasEmail && (hasFileUpload || (hasName && hasPhone));
}

/**
 * Analyze form fields to understand structure
 */
function analyzeFormFields(form) {
  const fields = [];
  const inputs = form.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    const field = {
      type: input.type || input.tagName.toLowerCase(),
      name: input.name,
      id: input.id,
      placeholder: input.placeholder,
      label: getFieldLabel(input),
      required: input.required,
      selector: generateSelector(input)
    };

    // Try to detect what kind of field this is
    field.fieldType = detectFieldType(field);

    fields.push(field);
  });

  return fields;
}

/**
 * Detect what type of data a field expects
 */
function detectFieldType(field) {
  const combined = `${field.name} ${field.placeholder} ${field.label}`.toLowerCase();

  if (field.type === 'email') return 'email';
  if (field.type === 'tel') return 'phone';
  if (field.type === 'file') return 'resume';

  if (combined.includes('first') && combined.includes('name')) return 'firstName';
  if (combined.includes('last') && combined.includes('name')) return 'lastName';
  if (combined.includes('full') && combined.includes('name')) return 'fullName';
  if (combined.includes('email')) return 'email';
  if (combined.includes('phone') || combined.includes('mobile')) return 'phone';
  if (combined.includes('linkedin')) return 'linkedin';
  if (combined.includes('github')) return 'github';
  if (combined.includes('website') || combined.includes('portfolio')) return 'website';
  if (combined.includes('location') || combined.includes('city')) return 'location';
  if (combined.includes('resume') || combined.includes('cv')) return 'resume';
  if (combined.includes('cover') && combined.includes('letter')) return 'coverLetter';
  if (combined.includes('experience')) return 'experience';
  if (combined.includes('education')) return 'education';

  return 'unknown';
}

/**
 * Get associated label for a field
 */
function getFieldLabel(input) {
  // Check for label with "for" attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent?.trim();
  }

  // Check if field is inside a label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent?.trim();

  // Check for nearby label
  const prevLabel = input.previousElementSibling;
  if (prevLabel && prevLabel.tagName === 'LABEL') {
    return prevLabel.textContent?.trim();
  }

  return null;
}

/**
 * Generate a robust CSS selector for an element
 */
function generateSelector(element) {
  // Try ID first (most reliable)
  if (element.id) return `#${element.id}`;

  // Try data-testid
  if (element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;

  // Try name attribute
  if (element.name) return `[name="${element.name}"]`;

  // Generate path-based selector
  const path = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }

    // Add nth-child if needed
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const index = siblings.indexOf(current);
      if (siblings.length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Handle autofill button click
 */
async function handleAutofillClick(button) {
  try {
    button.disabled = true;
    button.innerHTML = '⏳ Checking authentication...';

    // Check if user is authenticated
    const isAuthenticated = await window.JobFlowAPI.checkAuth();

    if (!isAuthenticated) {
      button.innerHTML = '❌ Not logged in';
      setTimeout(() => {
        alert(
          '⚠️ Not Authenticated\n\n' +
          'Please log in to the JobFlow web app first:\n\n' +
          '1. Click "Open Web App" in the extension popup\n' +
          '2. Log in or create an account\n' +
          '3. Return here and try again'
        );
        button.innerHTML = '⚡ JobFlow: Autofill';
        button.disabled = false;
      }, 1000);
      return;
    }

    button.innerHTML = '⏳ Loading profile...';

    // Get user profile
    const profileData = await window.JobFlowAPI.getProfile();

    if (!profileData.exists || !profileData.profile) {
      button.innerHTML = '❌ No profile';
      setTimeout(() => {
        alert(
          '⚠️ No Profile Found\n\n' +
          'Please create your autofill profile first:\n\n' +
          '1. Open the JobFlow web app\n' +
          '2. Go to Settings → Autofill Profile\n' +
          '3. Fill in your information\n' +
          '4. Return here and try again'
        );
        button.innerHTML = '⚡ JobFlow: Autofill';
        button.disabled = false;
      }, 1000);
      return;
    }

    button.innerHTML = '⏳ Filling form...';

    // Perform autofill
    const formData = detectedForms[0];
    const result = await autofillForm(formData, profileData.profile);

    if (result.success) {
      button.innerHTML = `✅ Filled ${result.filledCount} fields!`;
      setTimeout(() => {
        button.innerHTML = '⚡ JobFlow: Autofill';
        button.disabled = false;
      }, 3000);
    } else {
      button.innerHTML = '❌ Autofill failed';
      setTimeout(() => {
        alert(`⚠️ Autofill Failed\n\n${result.error}`);
        button.innerHTML = '⚡ JobFlow: Autofill';
        button.disabled = false;
      }, 1000);
    }
  } catch (error) {
    console.error('Autofill error:', error);
    button.innerHTML = '❌ Error';
    setTimeout(() => {
      alert(`⚠️ Error\n\n${error.message}\n\nPlease check console for details.`);
      button.innerHTML = '⚡ JobFlow: Autofill';
      button.disabled = false;
    }, 1000);
  }
}

/**
 * Autofill form with profile data
 */
async function autofillForm(formData, profile) {
  let filledCount = 0;
  const errors = [];

  // Field type to profile mapping
  const fieldMapping = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    fullName: profile.fullName || `${profile.firstName} ${profile.lastName}`,
    email: profile.email,
    phone: profile.phone,
    linkedinUrl: profile.linkedinUrl,
    linkedin: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    github: profile.githubUrl,
    portfolioUrl: profile.portfolioUrl,
    website: profile.portfolioUrl || profile.websiteUrl,
    websiteUrl: profile.websiteUrl,
    city: profile.city,
    location: profile.city && profile.state ? `${profile.city}, ${profile.state}` : (profile.city || profile.state),
    address: profile.address,
    currentTitle: profile.currentTitle
  };

  // Fill each field
  for (const field of formData.fields) {
    try {
      // Skip file uploads and unknown fields
      if (field.type === 'file' || field.fieldType === 'unknown') {
        continue;
      }

      // Get value from profile
      const value = fieldMapping[field.fieldType];

      if (!value) {
        continue; // Skip if no data for this field
      }

      // Find the element
      const element = document.querySelector(field.selector);

      if (!element) {
        console.warn(`Element not found for selector: ${field.selector}`);
        continue;
      }

      // Fill the field
      element.value = value;

      // Trigger input events to notify React/Vue/etc
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      filledCount++;
      console.log(`✅ Filled ${field.fieldType}:`, value);
    } catch (error) {
      console.error(`Error filling field ${field.fieldType}:`, error);
      errors.push(`${field.fieldType}: ${error.message}`);
    }
  }

  if (filledCount === 0) {
    return {
      success: false,
      error: 'No fields were filled. Make sure your profile has the required information.'
    };
  }

  return {
    success: true,
    filledCount,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * Add autofill button to the page
 */
function addAutofillButton(form) {
  // Don't add if already present
  if (document.getElementById('jobflow-autofill-btn')) return;

  const button = document.createElement('button');
  button.id = 'jobflow-autofill-btn';
  button.innerHTML = '⚡ JobFlow: Autofill';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.2s;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  // Click handler
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    await handleAutofillClick(button);
  });

  document.body.appendChild(button);
}

/**
 * Observe DOM changes for SPA navigation
 */
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    // Debounce form detection
    clearTimeout(window.formDetectionTimeout);
    window.formDetectionTimeout = setTimeout(() => {
      // Only re-detect if we don't have forms yet or URL changed
      if (detectedForms.length === 0) {
        detectForms();
      }
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_FORM_DATA':
      sendResponse({
        formsDetected: detectedForms.length,
        forms: detectedForms.map(f => ({
          fieldCount: f.fields.length,
          fields: f.fields
        }))
      });
      break;

    case 'START_RECORDING':
      startRecording();
      sendResponse({ success: true });
      break;

    case 'STOP_RECORDING':
      stopRecording();
      sendResponse({ success: true, actions: recordedActions });
      break;
  }

  return true; // Keep channel open
});

/**
 * Start recording user actions (for learning mode)
 */
function startRecording() {
  isRecording = true;
  recordedActions = [];

  // Show recording indicator
  showRecordingBanner();

  // Attach event listeners
  document.addEventListener('click', recordClick, true);
  document.addEventListener('input', recordInput, true);

  console.log('🔴 Recording started');
}

/**
 * Stop recording
 */
function stopRecording() {
  isRecording = false;

  // Remove event listeners
  document.removeEventListener('click', recordClick, true);
  document.removeEventListener('input', recordInput, true);

  // Hide recording indicator
  removeRecordingBanner();

  console.log('⏹️ Recording stopped', recordedActions);
}

/**
 * Record click action
 */
function recordClick(e) {
  if (!isRecording) return;

  const target = e.target;

  // Skip if clicking JobFlow UI
  if (target.closest('#jobflow-autofill-btn, #jobflow-recording-banner')) {
    return;
  }

  const action = {
    type: 'click',
    timestamp: Date.now(),
    selector: generateSelector(target),
    text: target.innerText || target.textContent,
    url: window.location.href
  };

  recordedActions.push(action);
  console.log('Recorded click:', action);
}

/**
 * Record input action
 */
function recordInput(e) {
  if (!isRecording) return;

  const target = e.target;

  const action = {
    type: 'input',
    timestamp: Date.now(),
    selector: generateSelector(target),
    fieldType: detectFieldType({
      name: target.name,
      placeholder: target.placeholder,
      label: getFieldLabel(target),
      type: target.type
    }),
    // Don't record actual value for privacy
    hasValue: target.value.length > 0,
    url: window.location.href
  };

  recordedActions.push(action);
  console.log('Recorded input:', action);
}

/**
 * Show recording indicator banner
 */
function showRecordingBanner() {
  const banner = document.createElement('div');
  banner.id = 'jobflow-recording-banner';
  banner.innerHTML = '🔴 Recording - Complete the application manually';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999998;
    padding: 12px;
    background: #f44336;
    color: white;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  document.body.appendChild(banner);
}

/**
 * Remove recording indicator
 */
function removeRecordingBanner() {
  const banner = document.getElementById('jobflow-recording-banner');
  if (banner) banner.remove();
}
