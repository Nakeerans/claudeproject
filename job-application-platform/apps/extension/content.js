// JobFlow Chrome Extension - Content Script
// Detects job application forms and provides autofill functionality

console.log('🚀 JobFlow extension loaded');

// State
let detectedForms = [];
let detectedJobInfo = null;
let isRecording = false;
let recordedActions = [];
let jobDataSent = false; // Track if job data has been sent to backend

// Initialize on page load
(function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectForms);
  } else {
    detectForms();
  }

  // Watch for dynamic content (SPAs)
  observeDOMChanges();

  // Auto-detect and extract job information on job posting pages
  autoDetectJobPosting();
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

  // Also detect job information on the page
  if (detectedForms.length > 0) {
    detectedJobInfo = extractJobInformation();
    if (detectedJobInfo) {
      console.log('💼 Job information detected:', detectedJobInfo);
    }
  }
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
 * Extract job information from the page for AI-based resume tailoring
 * Uses multi-fallback strategy similar to Simplify extension
 */
function extractJobInformation() {
  const jobInfo = {
    title: null,
    company: null,
    description: null,
    requirements: [],
    responsibilities: [],
    skills: [],
    location: null,
    jobType: null,
    salary: null,
    url: window.location.href,
    platform: detectJobPlatform(),
    extractedAt: new Date().toISOString()
  };

  // Platform-specific extraction
  if (jobInfo.platform) {
    extractPlatformSpecificData(jobInfo);
  }

  // Generic extraction with multiple fallbacks (if platform-specific didn't work)
  if (!jobInfo.title) {
    jobInfo.title = extractJobTitle();
  }
  if (!jobInfo.company) {
    jobInfo.company = extractCompany();
  }
  if (!jobInfo.description) {
    jobInfo.description = extractDescription();
  }
  if (!jobInfo.location) {
    jobInfo.location = extractLocation();
  }

  // Parse structured data from description
  if (jobInfo.description) {
    parseDescriptionSections(jobInfo);
  }

  // Extract metadata
  extractJobMetadata(jobInfo);

  // Only return if we found at least a title or description
  return (jobInfo.title || jobInfo.description) ? jobInfo : null;
}

/**
 * Detect which job platform/ATS we're on
 */
function detectJobPlatform() {
  const url = window.location.href;
  const hostname = window.location.hostname;

  // Platform detection patterns (similar to Simplify's approach)
  if (url.includes('linkedin.com/jobs')) return 'linkedin';
  if (url.includes('greenhouse.io')) return 'greenhouse';
  if (url.includes('lever.co')) return 'lever';
  if (url.includes('myworkdayjobs.com')) return 'workday';
  if (url.includes('indeed.com')) return 'indeed';
  if (url.includes('google.com/about/careers')) return 'google';
  if (url.includes('jobs.apple.com')) return 'apple';
  if (url.includes('bamboohr.com')) return 'bamboohr';
  if (url.includes('breezy.hr')) return 'breezy';
  if (url.includes('ashbyhq.com')) return 'ashby';
  if (url.includes('recruitee.com')) return 'recruitee';
  if (url.includes('smartrecruiters.com')) return 'smartrecruiters';
  if (url.includes('jobvite.com')) return 'jobvite';
  if (url.includes('taleo.net')) return 'taleo';
  if (url.includes('icims.com')) return 'icims';
  if (url.includes('ultipro.com') || url.includes('recruiting.adp.com')) return 'adp';

  return null;
}

/**
 * Extract platform-specific job data
 */
function extractPlatformSpecificData(jobInfo) {
  switch (jobInfo.platform) {
    case 'linkedin':
      jobInfo.title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title')?.textContent.trim();
      jobInfo.company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name')?.textContent.trim();
      jobInfo.location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent.trim();
      jobInfo.description = document.querySelector('.jobs-description__content, .jobs-box__html-content')?.textContent.trim();
      break;

    case 'greenhouse':
      jobInfo.title = document.querySelector('.app-title, #header .job-title')?.textContent.trim();
      jobInfo.company = document.querySelector('.company-name')?.textContent.trim();
      jobInfo.location = document.querySelector('.location')?.textContent.trim();
      jobInfo.description = document.querySelector('#content, .job-post-content')?.textContent.trim();
      break;

    case 'lever':
      jobInfo.title = document.querySelector('.posting-headline h2')?.textContent.trim();
      jobInfo.company = document.querySelector('.main-header-text-company-logo, a[aria-label*="logo"]')?.textContent.trim();
      jobInfo.location = document.querySelector('.posting-categories .location, .workplaceTypes')?.textContent.trim();
      jobInfo.description = document.querySelector('.section-wrapper, .posting-description')?.textContent.trim();
      break;

    case 'workday':
      // Enhanced Workday selectors with multiple fallbacks
      jobInfo.title = document.querySelector('[data-automation-id="jobPostingHeader"], h2[class*="title"], h1')?.textContent.trim();
      jobInfo.company = document.querySelector('[data-automation-id="companyName"], .company-name, [class*="company"]')?.textContent.trim();
      jobInfo.location = document.querySelector('[data-automation-id="locations"], [data-automation-id="location"], [class*="location"]')?.textContent.trim();

      // Try multiple description selectors for Workday
      const descElement = document.querySelector('[data-automation-id="jobPostingDescription"]') ||
                         document.querySelector('[class*="description"]') ||
                         document.querySelector('[id*="description"]') ||
                         document.querySelector('div[role="article"]') ||
                         document.querySelector('main');
      jobInfo.description = descElement?.textContent.trim();

      // Extract job ID from URL
      const jobIdMatch = window.location.href.match(/_([A-Z0-9_-]+)(?:\?|$)/);
      if (jobIdMatch) {
        jobInfo.jobId = jobIdMatch[1];
      }
      break;

    case 'indeed':
      jobInfo.title = document.querySelector('.jobsearch-JobInfoHeader-title, [class*="jobTitle"]')?.textContent.trim();
      jobInfo.company = document.querySelector('[data-company-name="true"], [class*="companyName"]')?.textContent.trim();
      jobInfo.location = document.querySelector('[class*="companyLocation"]')?.textContent.trim();
      jobInfo.description = document.querySelector('#jobDescriptionText, [class*="jobDescription"]')?.textContent.trim();
      break;

    case 'google':
      jobInfo.title = document.querySelector('h2[itemprop="title"]')?.textContent.trim();
      jobInfo.company = 'Google';
      jobInfo.location = document.querySelector('[itemprop="address"]')?.textContent.trim();
      jobInfo.description = document.querySelector('[itemprop="description"], .gc-job-detail__description')?.textContent.trim();
      break;

    case 'ashby':
      jobInfo.title = document.querySelector('._jobTitle_qhl85_8')?.textContent.trim();
      jobInfo.company = document.querySelector('._companyName_qhl85_41')?.textContent.trim();
      jobInfo.description = document.querySelector('._jobDescription_qhl85_73')?.textContent.trim();
      break;
  }
}

/**
 * Generic job title extraction with multiple fallbacks
 */
function extractJobTitle() {
  const selectors = [
    // Specific job title selectors
    'h1[class*="job"][class*="title"]',
    'h1[class*="jobTitle"]',
    'h1[class*="job-title"]',
    'h1[class*="position"]',
    '[data-testid*="job"][data-testid*="title"]',
    '[data-automation-id*="jobTitle"]',
    '[class*="posting-headline"] h2',
    '.job-title',
    // Generic heading selectors (last resort)
    'h1',
    'header h1',
    'main h1'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      // Valid job title: not too long, not navigation text
      if (text.length > 3 && text.length < 150 &&
          !text.toLowerCase().includes('sign in') &&
          !text.toLowerCase().includes('home')) {
        return text;
      }
    }
  }
  return null;
}

/**
 * Generic company name extraction
 */
function extractCompany() {
  const selectors = [
    '[class*="company"][class*="name"]',
    '[class*="companyName"]',
    '[class*="company-name"]',
    '[data-testid*="company"]',
    '[data-automation-id*="company"]',
    '[class*="employer"]',
    'a[class*="company"]',
    '.company',
    '[itemprop="hiringOrganization"]',
    '[itemprop="name"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 1 && text.length < 100) {
        return text;
      }
    }
  }
  return null;
}

/**
 * Generic description extraction with multiple strategies
 */
function extractDescription() {
  const selectors = [
    '[class*="job"][class*="description"]',
    '[class*="jobDescription"]',
    '[class*="job-description"]',
    '[id*="job"][id*="description"]',
    '[id*="jobDescription"]',
    '[data-testid*="description"]',
    '[data-automation-id*="description"]',
    '[class*="posting-description"]',
    '.description',
    '[itemprop="description"]'
  ];

  // Try specific selectors first
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 100) {
        return text;
      }
    }
  }

  // Fallback: find largest text block with job keywords
  const containers = document.querySelectorAll('div, section, article, main');
  let bestMatch = null;
  let maxScore = 0;

  for (const container of containers) {
    const text = container.textContent.trim();
    if (text.length < 200) continue;

    // Score based on job-related keywords
    let score = 0;
    const lower = text.toLowerCase();
    if (lower.includes('responsibilities')) score += 3;
    if (lower.includes('requirements')) score += 3;
    if (lower.includes('qualifications')) score += 3;
    if (lower.includes('about the role')) score += 2;
    if (lower.includes('we are looking for')) score += 2;
    if (lower.includes('experience')) score += 1;
    if (lower.includes('skills')) score += 1;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = text;
    }
  }

  return bestMatch;
}

/**
 * Extract location information
 */
function extractLocation() {
  const selectors = [
    '[class*="location"]',
    '[class*="jobLocation"]',
    '[data-testid*="location"]',
    '[data-automation-id*="location"]',
    '[itemprop="jobLocation"]',
    '[itemprop="address"]',
    'span[class*="location"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 2 && text.length < 100) {
        return text;
      }
    }
  }
  return null;
}

/**
 * Parse description into structured sections
 * Captures raw sections for AI processing on the backend
 */
function parseDescriptionSections(jobInfo) {
  const desc = jobInfo.description;

  // Instead of filtering by length, extract the full sections with their context
  // The AI backend will intelligently parse and categorize these

  // Extract requirements/qualifications section
  const reqPatterns = [
    /(?:requirements?|qualifications?|what (?:you'll need|we're looking for)|minimum qualifications?|required qualifications?|must[- ]haves?)[\s\S]*?(?=(?:responsibilities|preferred|nice to have|about|benefits|we offer|compensation|equal opportunity|$))/i,
    /(?:required skills?|must have)[\s\S]*?(?=(?:responsibilities|preferred|about|benefits|$))/i
  ];

  for (const pattern of reqPatterns) {
    const match = desc.match(pattern);
    if (match) {
      // Extract the section title
      const sectionText = match[0];
      const titleMatch = sectionText.match(/^[^\n]*/);
      const sectionTitle = titleMatch ? titleMatch[0].trim() : 'Requirements';

      // Split by common bullet point indicators
      const rawItems = sectionText
        .split(/\n|•|·|\*|(?:^|\n)\s*[-–—]\s*|(?:^|\n)\s*\d+[\.)]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // Store raw requirements with metadata for AI processing
      jobInfo.requirements = {
        sectionTitle: sectionTitle,
        rawText: sectionText,
        items: rawItems,
        needsAIParsing: true
      };
      break;
    }
  }

  // Extract responsibilities section
  const respPatterns = [
    /(?:responsibilities|what you'll do|duties|you will|day[- ]to[- ]day|your role|job description|the role)[\s\S]*?(?=(?:requirements|qualifications|benefits|about|we offer|compensation|equal opportunity|$))/i,
    /(?:key responsibilities|primary duties|main responsibilities)[\s\S]*?(?=(?:requirements|qualifications|benefits|$))/i
  ];

  for (const pattern of respPatterns) {
    const match = desc.match(pattern);
    if (match) {
      const sectionText = match[0];
      const titleMatch = sectionText.match(/^[^\n]*/);
      const sectionTitle = titleMatch ? titleMatch[0].trim() : 'Responsibilities';

      const rawItems = sectionText
        .split(/\n|•|·|\*|(?:^|\n)\s*[-–—]\s*|(?:^|\n)\s*\d+[\.)]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      jobInfo.responsibilities = {
        sectionTitle: sectionTitle,
        rawText: sectionText,
        items: rawItems,
        needsAIParsing: true
      };
      break;
    }
  }

  // Extract preferred/nice-to-have qualifications
  const preferredPatterns = [
    /(?:preferred qualifications?|nice[- ]to[- ]have|bonus|preferred skills?|a plus|ideal candidate)[\s\S]*?(?=(?:about|benefits|compensation|equal opportunity|$))/i
  ];

  for (const pattern of preferredPatterns) {
    const match = desc.match(pattern);
    if (match) {
      const sectionText = match[0];
      const titleMatch = sectionText.match(/^[^\n]*/);
      const sectionTitle = titleMatch ? titleMatch[0].trim() : 'Preferred Qualifications';

      const rawItems = sectionText
        .split(/\n|•|·|\*|(?:^|\n)\s*[-–—]\s*|(?:^|\n)\s*\d+[\.)]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      jobInfo.preferredQualifications = {
        sectionTitle: sectionTitle,
        rawText: sectionText,
        items: rawItems,
        needsAIParsing: true
      };
      break;
    }
  }

  // Extract benefits section
  const benefitsPatterns = [
    /(?:benefits|perks|what we offer|compensation|package)[\s\S]*?(?=(?:equal opportunity|about us|apply|$))/i
  ];

  for (const pattern of benefitsPatterns) {
    const match = desc.match(pattern);
    if (match && match[0].length < 1000) { // Reasonable benefits section length
      const sectionText = match[0];
      const titleMatch = sectionText.match(/^[^\n]*/);
      const sectionTitle = titleMatch ? titleMatch[0].trim() : 'Benefits';

      const rawItems = sectionText
        .split(/\n|•|·|\*|(?:^|\n)\s*[-–—]\s*|(?:^|\n)\s*\d+[\.)]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

      jobInfo.benefits = {
        sectionTitle: sectionTitle,
        rawText: sectionText,
        items: rawItems,
        needsAIParsing: true
      };
    }
  }

  // Basic keyword-based skill extraction (will be enhanced by AI)
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'golang', 'go', 'rust', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'svelte', 'node\\.?js', 'express', 'django', 'flask', 'spring', 'asp\\.net',
    'sql', 'nosql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ansible',
    'git', 'ci/cd', 'jenkins', 'gitlab', 'github actions',
    'agile', 'scrum', 'kanban', 'jira',
    'rest', 'graphql', 'grpc', 'microservices', 'api'
  ];

  const foundSkills = new Set();
  const descLower = desc.toLowerCase();
  for (const skill of skillKeywords) {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (regex.test(descLower)) {
      foundSkills.add(skill.replace(/\\b/g, '').replace(/\\\+/g, '+').replace(/\\\./g, ''));
    }
  }
  jobInfo.detectedSkills = Array.from(foundSkills);
}

/**
 * Extract job metadata (type, salary, etc.)
 */
function extractJobMetadata(jobInfo) {
  const pageText = document.body.textContent.toLowerCase();

  // Job type
  const jobTypes = [];
  if (/\bfull[- ]time\b/.test(pageText)) jobTypes.push('Full-time');
  if (/\bpart[- ]time\b/.test(pageText)) jobTypes.push('Part-time');
  if (/\bcontract\b/.test(pageText)) jobTypes.push('Contract');
  if (/\btemporary\b/.test(pageText)) jobTypes.push('Temporary');
  if (/\binternship\b/.test(pageText)) jobTypes.push('Internship');
  if (/\bremote\b/.test(pageText)) jobTypes.push('Remote');
  if (/\bhybrid\b/.test(pageText)) jobTypes.push('Hybrid');
  if (/\bon[- ]site\b/.test(pageText)) jobTypes.push('On-site');

  jobInfo.jobType = jobTypes.length > 0 ? jobTypes.join(', ') : null;

  // Salary (US format)
  const salaryPatterns = [
    /\$[\d,]+(?:k|,\d{3})?(?:\s*[-–—]\s*\$?[\d,]+(?:k|,\d{3})?)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|annum))?/i,
    /[\d,]+k?\s*[-–—]\s*[\d,]+k?\s*(?:USD|dollars?|per year)/i
  ];

  for (const pattern of salaryPatterns) {
    const match = document.body.textContent.match(pattern);
    if (match) {
      jobInfo.salary = match[0].trim();
      break;
    }
  }
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

    button.innerHTML = '⏳ Checking for patterns...';

    // Check for saved patterns for this site
    let patternId = null;
    try {
      const patternsData = await window.JobFlowAPI.getPatterns(window.location.href);
      if (patternsData.patterns && patternsData.patterns.length > 0) {
        // Use the most recently used pattern
        const pattern = patternsData.patterns[0];
        patternId = pattern.id;
        console.log('Using saved pattern:', pattern);
      }
    } catch (error) {
      console.log('No patterns found, using field detection');
    }

    button.innerHTML = '⏳ Filling form...';

    // Perform autofill
    const formData = detectedForms[0];
    const result = await autofillForm(formData, profileData.profile);

    // Update pattern statistics if we used a pattern
    if (result.success && patternId) {
      try {
        await window.JobFlowAPI.updatePatternStats(patternId, true);
      } catch (error) {
        console.error('Failed to update pattern stats:', error);
      }
    }

    if (result.success) {
      button.innerHTML = `✅ Filled ${result.filledCount} fields!`;
      setTimeout(() => {
        button.innerHTML = '⚡ JobFlow: Autofill';
        button.disabled = false;
      }, 3000);
    } else {
      button.innerHTML = '❌ Autofill failed';
      // Update pattern statistics as failed if we used a pattern
      if (patternId) {
        try {
          await window.JobFlowAPI.updatePatternStats(patternId, false);
        } catch (error) {
          console.error('Failed to update pattern stats:', error);
        }
      }
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
        })),
        jobInfo: detectedJobInfo
      });
      break;

    case 'GET_JOB_INFO':
      // Force re-extraction of job info
      const jobInfo = extractJobInformation();
      sendResponse({
        success: true,
        jobInfo: jobInfo
      });
      break;

    case 'START_RECORDING':
      startRecording();
      sendResponse({ success: true });
      break;

    case 'STOP_RECORDING':
      stopRecording();
      // Build field mappings from detected forms
      const fieldMappings = detectedForms.length > 0
        ? detectedForms[0].fields.map(f => ({
            selector: f.selector,
            fieldType: f.fieldType,
            label: f.label,
            name: f.name
          }))
        : [];
      sendResponse({
        success: true,
        actions: recordedActions,
        fieldMappings,
        jobInfo: detectedJobInfo // Include job info in recording data
      });
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
  document.addEventListener('change', recordChange, true); // For dropdowns and checkboxes

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
  document.removeEventListener('change', recordChange, true);

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
    elementType: target.tagName.toLowerCase(),
    inputType: target.type,
    value: target.value, // Record actual value for autofill
    name: target.name,
    id: target.id,
    placeholder: target.placeholder,
    label: getFieldLabel(target),
    url: window.location.href
  };

  recordedActions.push(action);
  console.log('Recorded input:', action);
}

/**
 * Record change action (for dropdowns, checkboxes, radio buttons)
 */
function recordChange(e) {
  if (!isRecording) return;

  const target = e.target;

  // Record for all input types that trigger change events
  const action = {
    type: 'change',
    timestamp: Date.now(),
    selector: generateSelector(target),
    fieldType: detectFieldType({
      name: target.name,
      placeholder: target.placeholder,
      label: getFieldLabel(target),
      type: target.type
    }),
    elementType: target.tagName.toLowerCase(), // 'select', 'input', 'textarea'
    inputType: target.type, // 'checkbox', 'radio', 'select-one', etc.
    value: target.value, // Record actual value for autofill
    name: target.name,
    id: target.id,
    label: getFieldLabel(target),
    url: window.location.href
  };

  // Add additional data for specific element types
  if (target.type === 'checkbox' || target.type === 'radio') {
    action.checked = target.checked;
  }

  // For select elements, record selected option details
  if (target.tagName.toLowerCase() === 'select') {
    const selectedOption = target.options[target.selectedIndex];
    action.selectedText = selectedOption ? selectedOption.text : '';
    action.selectedIndex = target.selectedIndex;
  }

  recordedActions.push(action);
  console.log('Recorded change:', action);
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

/**
 * Auto-detect job posting pages and extract information
 * Runs automatically on page load for supported platforms
 */
async function autoDetectJobPosting() {
  // Wait for page to load dynamically (SPAs like Workday)
  setTimeout(async () => {
    const platform = detectJobPlatform();

    // Only proceed if we're on a known job platform
    if (!platform) {
      console.log('JobFlow: Not on a recognized job platform');
      return;
    }

    console.log(`JobFlow: Detected ${platform} platform, extracting job data...`);

    // Extract job information
    const jobInfo = extractJobInformation();

    if (!jobInfo || !jobInfo.title) {
      console.log('JobFlow: Could not extract job information, will retry on DOM changes');
      return;
    }

    console.log('JobFlow: Successfully extracted job data:', jobInfo);
    detectedJobInfo = jobInfo;

    // Show extraction notification
    showJobExtractedNotification(jobInfo);

    // Auto-send to backend when in learning mode or when user is authenticated
    await autoSendJobDataToBackend(jobInfo);
  }, 2000); // Wait 2 seconds for dynamic content to load
}

/**
 * Automatically send job data to backend for AI processing
 * This enables resume tailoring and job tracking
 */
async function autoSendJobDataToBackend(jobInfo) {
  if (jobDataSent) {
    console.log('JobFlow: Job data already sent to backend');
    return;
  }

  try {
    // Check if user is authenticated
    const isAuthenticated = await window.JobFlowAPI.checkAuth();

    if (!isAuthenticated) {
      console.log('JobFlow: User not authenticated, skipping backend submission');
      return;
    }

    console.log('JobFlow: Sending job data to backend for AI processing...');

    // Send job data to backend
    const result = await window.JobFlowAPI.saveJobPosting(jobInfo);

    console.log('JobFlow: Job data sent successfully!', result);
    jobDataSent = true;

    // Show success notification
    showJobSavedNotification(result);
  } catch (error) {
    console.error('JobFlow: Failed to send job data to backend:', error);
    // Don't show error to user, just log it
  }
}

/**
 * Show notification that job data was extracted
 */
function showJobExtractedNotification(jobInfo) {
  const notification = document.createElement('div');
  notification.id = 'jobflow-extracted-notification';
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">💼</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Job Details Detected!</div>
        <div style="font-size: 12px; opacity: 0.9;">${jobInfo.title || 'Unknown Title'} at ${jobInfo.company || 'Unknown Company'}</div>
      </div>
    </div>
  `;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 16px 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 12px;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Show notification that job was saved to backend
 */
function showJobSavedNotification(result) {
  const notification = document.createElement('div');
  notification.id = 'jobflow-saved-notification';
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">✅</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Job Saved Successfully!</div>
        <div style="font-size: 12px; opacity: 0.9;">AI is preparing tailored resume...</div>
      </div>
    </div>
  `;
  notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 999999;
    padding: 16px 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border-radius: 12px;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
