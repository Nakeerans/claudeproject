// JobFlow Extension - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Get references to UI elements
  const autofillBtn = document.getElementById('autofill-btn');
  const recordBtn = document.getElementById('record-btn');
  const formCountDiv = document.getElementById('form-count');
  const openWebappLink = document.getElementById('open-webapp');

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
    } else {
      formCountDiv.textContent = 'ℹ️  No application forms detected';
      formCountDiv.className = 'visible';
      formCountDiv.style.background = '#f3f4f6';
      formCountDiv.style.color = '#666';
    }
  } catch (error) {
    console.log('Could not connect to content script:', error);
    formCountDiv.textContent = 'ℹ️  Refresh page to detect forms';
    formCountDiv.className = 'visible';
  }

  // Autofill button click
  autofillBtn.addEventListener('click', async () => {
    autofillBtn.disabled = true;
    autofillBtn.textContent = '⏳ Autofilling...';

    try {
      // In a real implementation, this would:
      // 1. Get user profile from storage/API
      // 2. Get learned pattern for this site
      // 3. Send autofill command to content script

      // For now, just show a message
      setTimeout(() => {
        alert(
          'Autofill functionality:\n\n' +
          '1. Will fetch your profile data\n' +
          '2. Check for learned patterns for this site\n' +
          '3. Automatically fill all detected fields\n\n' +
          'Connect to the web app to set up your profile!'
        );

        autofillBtn.textContent = 'Autofill Current Page';
        autofillBtn.disabled = false;
      }, 500);
    } catch (error) {
      console.error('Autofill error:', error);
      autofillBtn.textContent = 'Autofill Current Page';
      autofillBtn.disabled = false;
    }
  });

  // Record button click
  recordBtn.addEventListener('click', async () => {
    if (recordBtn.textContent.includes('Start')) {
      // Start recording
      recordBtn.textContent = '⏹️  Stop Learning Mode';
      recordBtn.style.background = '#fef2f2';
      recordBtn.style.color = '#991b1b';

      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' });
      } catch (error) {
        console.error('Could not start recording:', error);
      }
    } else {
      // Stop recording
      recordBtn.textContent = '📊 Processing...';
      recordBtn.disabled = true;

      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' });

        // Save pattern to backend
        try {
          const result = await window.JobFlowAPI.savePattern({
            siteUrl: tab.url,
            siteName: new URL(tab.url).hostname,
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
    // Open the deployed Azure web app
    chrome.tabs.create({ url: 'http://4.157.253.229:3000' });
  });
});
