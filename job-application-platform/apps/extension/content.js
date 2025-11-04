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

    button.disabled = true;
    button.innerHTML = '⏳ Checking...';

    // In a real implementation, this would:
    // 1. Check if user has a profile
    // 2. Check if there's a learned pattern for this site
    // 3. Either autofill or start recording mode

    // For now, show a demo message
    setTimeout(() => {
      const formData = detectedForms[0];

      alert(
        `✅ JobFlow Extension Active!\n\n` +
        `Detected ${formData.fields.length} form fields:\n` +
        formData.fields
          .filter(f => f.fieldType !== 'unknown')
          .map(f => `• ${f.fieldType}: ${f.label || f.placeholder || f.name}`)
          .join('\n') +
        `\n\n🔮 Next steps:\n` +
        `1. Connect to JobFlow web app\n` +
        `2. Complete your profile\n` +
        `3. This form will autofill automatically!`
      );

      button.innerHTML = '⚡ JobFlow: Autofill';
      button.disabled = false;
    }, 1000);
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
