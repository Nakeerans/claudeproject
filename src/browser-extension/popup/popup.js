// Popup UI Script
document.addEventListener('DOMContentLoaded', () => {
  const scrapeBtn = document.getElementById('scrapeBtn');
  const selectBtn = document.getElementById('selectBtn');
  const autoExtractBtn = document.getElementById('autoExtractBtn');
  const generateBtn = document.getElementById('generateBtn');
  const promptInput = document.getElementById('promptInput');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');

  // Scrape current page
  scrapeBtn.addEventListener('click', async () => {
    try {
      showStatus('Scraping page...', 'success');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.runtime.sendMessage(
        { action: 'scrapeCurrentPage', selectors: {} },
        (response) => {
          if (response.error) {
            showStatus(`Error: ${response.error}`, 'error');
          } else {
            showStatus('Scraping complete!', 'success');
            showResult(JSON.stringify(response, null, 2));
          }
        }
      );
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Select element mode
  selectBtn.addEventListener('click', async () => {
    showStatus('Selection mode activated. Click on any element in the page.', 'success');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'enableSelectionMode'
    });
  });

  // Auto extract
  autoExtractBtn.addEventListener('click', async () => {
    try {
      showStatus('Auto-extracting data...', 'success');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(
        tab.id,
        { action: 'extractData', config: {} },
        (response) => {
          if (response && response.success) {
            showStatus('Extraction complete!', 'success');
            showResult(JSON.stringify(response.data, null, 2));
          } else {
            showStatus('Error during extraction', 'error');
          }
        }
      );
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Generate code
  generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();

    if (!prompt) {
      showStatus('Please enter a prompt', 'error');
      return;
    }

    try {
      showStatus('Generating code...', 'success');

      chrome.runtime.sendMessage(
        { action: 'generateCode', prompt },
        (response) => {
          if (response.error) {
            showStatus(`Error: ${response.error}`, 'error');
          } else {
            showStatus('Code generated!', 'success');
            showResult(response.code || JSON.stringify(response, null, 2));
          }
        }
      );
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Helper functions
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }

  function showResult(data) {
    resultDiv.textContent = data;
    resultDiv.style.display = 'block';
  }
});
