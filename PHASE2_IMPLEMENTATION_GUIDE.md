# Phase 2 Implementation Guide - Completed & Remaining Features

## ✅ COMPLETED (AI Features)

### 1. AI Resume Builder & Cover Letter Generator ✅
**Status:** FULLY IMPLEMENTED

**Backend API:** `/src/server/routes/ai.js`
- ✅ POST `/api/ai/generate-resume` - Generate professional resumes
- ✅ POST `/api/ai/generate-cover-letter` - Generate tailored cover letters
- ✅ POST `/api/ai/analyze-job` - Analyze job descriptions
- ✅ POST `/api/ai/interview-prep` - Generate interview preparation guides
- ✅ POST `/api/ai/improve-resume-section` - Improve specific resume sections

**Frontend Page:** `/client/src/pages/AITools.jsx`
- ✅ 4 Tabs: Resume Builder, Cover Letter, Job Analysis, Interview Prep
- ✅ Full form inputs for user information
- ✅ Integration with existing jobs
- ✅ Copy to clipboard functionality
- ✅ Professional styling

**Features:**
- Claude 3.5 Sonnet integration
- Resume styles: Professional, Creative, Technical, Executive
- Cover letter tones: Professional, Enthusiastic, Formal, Conversational
- Job analysis with skill matching
- Interview question generation
- ATS-friendly formatting

**Setup Required:**
1. Set `ANTHROPIC_API_KEY` in `.env`
2. Navigate to `/ai-tools` in the app
3. Start generating AI-powered content!

---

## 🚧 IN PROGRESS (Chrome Extension)

### 2. Chrome Extension for Job Saving
**Status:** MANIFEST CREATED, NEEDS COMPLETION

**Created Files:**
- `chrome-extension/manifest.json` ✅

**Remaining Files Needed:**
1. **popup.html** - Extension popup UI
2. **popup.js** - Popup logic
3. **content.js** - Page scraping logic
4. **background.js** - Service worker
5. **content.css** - Styling for injected button
6. **icons/** - Extension icons (16x16, 48x48, 128x128)

**Implementation Steps:**

#### popup.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Save Job</title>
  <style>
    body {
      width: 300px;
      padding: 15px;
      font-family: Arial, sans-serif;
    }
    .btn {
      width: 100%;
      padding: 10px;
      background: #6a4feb;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .status {
      margin-top: 10px;
      padding: 10px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <h3>Job Tracker</h3>
  <div id="jobInfo"></div>
  <button id="saveBtn" class="btn">Save Job</button>
  <div id="status" class="status"></div>
  <script src="popup.js"></script>
</body>
</html>
```

#### content.js - Extract job details from pages
```javascript
// Detect job board and extract data
function extractJobData() {
  const url = window.location.href;
  
  if (url.includes('linkedin.com')) {
    return extractLinkedIn();
  } else if (url.includes('indeed.com')) {
    return extractIndeed();
  } else if (url.includes('glassdoor.com')) {
    return extractGlassdoor();
  }
  
  return null;
}

function extractLinkedIn() {
  return {
    companyName: document.querySelector('.topcard__org-name-link')?.textContent.trim(),
    jobTitle: document.querySelector('.topcard__title')?.textContent.trim(),
    location: document.querySelector('.topcard__flavor--bullet')?.textContent.trim(),
    description: document.querySelector('.show-more-less-html__markup')?.textContent.trim(),
    jobUrl: window.location.href
  };
}

// Similar functions for Indeed, Glassdoor, etc.

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJob') {
    sendResponse(extractJobData());
  }
});

// Add "Save to Job Tracker" button to pages
function injectSaveButton() {
  const btn = document.createElement('button');
  btn.textContent = '💾 Save to Job Tracker';
  btn.className = 'job-tracker-save-btn';
  btn.onclick = () => {
    chrome.runtime.sendMessage({
      action: 'saveJob',
      data: extractJobData()
    });
  };
  
  // Inject button based on job board
  if (window.location.href.includes('linkedin.com')) {
    document.querySelector('.topcard__content-left')?.appendChild(btn);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSaveButton);
} else {
  injectSaveButton();
}
```

#### popup.js
```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const jobInfo = document.getElementById('jobInfo');
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Extract job data from page
  chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, (job) => {
    if (job) {
      jobInfo.innerHTML = `
        <p><strong>${job.jobTitle}</strong></p>
        <p>${job.companyName}</p>
      `;
    } else {
      jobInfo.innerHTML = '<p>No job detected on this page</p>';
      saveBtn.disabled = true;
    }
  });
  
  // Save job
  saveBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'extractJob' }, async (job) => {
      if (!job) {
        status.textContent = 'Failed to extract job data';
        return;
      }
      
      // Get API token from storage
      const { apiToken } = await chrome.storage.sync.get('apiToken');
      
      if (!apiToken) {
        status.textContent = 'Please login first';
        return;
      }
      
      // Save to backend
      try {
        const response = await fetch('http://localhost:3000/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          },
          body: JSON.stringify({
            ...job,
            stage: 'WISHLIST'
          })
        });
        
        if (response.ok) {
          status.style.background = '#10b981';
          status.textContent = '✓ Job saved successfully!';
        } else {
          status.textContent = 'Failed to save job';
        }
      } catch (error) {
        status.textContent = 'Error: ' + error.message;
      }
    });
  });
});
```

**Installation:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Extension will appear in toolbar

**Supported Job Boards:**
- LinkedIn
- Indeed
- Glassdoor
- Monster
- ZipRecruiter

---

## ⏳ PENDING IMPLEMENTATION

### 3. Calendar Integration (Google Calendar)

**Required Steps:**

1. **Add Google Calendar API credentials** to `.env`:
```env
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/calendar/callback
```

2. **Backend Route:** `src/server/routes/calendar.js`
```javascript
import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CALENDAR_CLIENT_ID,
  process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  process.env.GOOGLE_CALENDAR_REDIRECT_URI
);

// Generate auth URL
router.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar']
  });
  res.json({ url });
});

// Handle callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  
  // Save tokens to user's profile
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      calendarTokens: JSON.stringify(tokens)
    }
  });
  
  res.redirect('/settings');
});

// Sync interview to calendar
router.post('/sync-interview/:id', async (req, res) => {
  const interview = await prisma.interview.findUnique({
    where: { id: req.params.id },
    include: { job: true }
  });
  
  // Set tokens
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  oauth2Client.setCredentials(JSON.parse(user.calendarTokens));
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Create event
  const event = {
    summary: `Interview: ${interview.job.companyName}`,
    description: `${interview.interviewType} interview for ${interview.job.jobTitle}`,
    start: { dateTime: interview.interviewDate },
    end: {
      dateTime: new Date(new Date(interview.interviewDate).getTime() + (interview.duration || 60) * 60000)
    },
    location: interview.locationOrLink
  };
  
  const result = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
  
  res.json({ eventId: result.data.id });
});

export default router;
```

3. **Frontend Settings Page Integration:**
- Add "Connect Google Calendar" button
- Show sync status
- Auto-sync interviews to calendar

---

### 4. Email Notifications

**Required Setup:**

1. **Install nodemailer:**
```bash
npm install nodemailer
```

2. **Add email config to `.env`:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Job Tracker <noreply@jobtracker.com>
```

3. **Create Email Service:** `src/utils/emailService.js`
```javascript
import nodemailer from 'nodemailer';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendInterviewReminder(interview, user) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Interview Reminder: ${interview.job.companyName}`,
    html: `
      <h2>Interview Reminder</h2>
      <p>Hi ${user.name},</p>
      <p>You have an upcoming interview:</p>
      <ul>
        <li><strong>Company:</strong> ${interview.job.companyName}</li>
        <li><strong>Position:</strong> ${interview.job.jobTitle}</li>
        <li><strong>Type:</strong> ${interview.interviewType}</li>
        <li><strong>Date:</strong> ${new Date(interview.interviewDate).toLocaleString()}</li>
        ${interview.locationOrLink ? `<li><strong>Link:</strong> ${interview.locationOrLink}</li>` : ''}
      </ul>
      <p>Good luck!</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
  logger.info(`Interview reminder sent to ${user.email}`);
}

export async function sendApplicationDeadlineReminder(job, user) {
  // Similar implementation
}

export async function sendWeeklySummary(user, stats) {
  // Weekly summary email
}
```

4. **Cron Job for Reminders:** `src/utils/cronJobs.js`
```javascript
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendInterviewReminder } from './emailService.js';

const prisma = new PrismaClient();

// Run every hour to check for interviews in next 24 hours
cron.schedule('0 * * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const upcomingInterviews = await prisma.interview.findMany({
    where: {
      interviewDate: {
        gte: new Date(),
        lte: tomorrow
      },
      completed: false,
      reminderSent: false
    },
    include: {
      job: {
        include: { user: true }
      }
    }
  });
  
  for (const interview of upcomingInterviews) {
    await sendInterviewReminder(interview, interview.job.user);
    await prisma.interview.update({
      where: { id: interview.id },
      data: { reminderSent: true }
    });
  }
});
```

**Email Types:**
- Interview reminders (24 hours before)
- Application deadline reminders
- Weekly summary of activity
- Offer received notifications

---

### 5. Landing/Marketing Page

**Create:** `/client/src/pages/Landing.jsx`

```jsx
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Hero Section */}
      <section className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Organize Your Job Search
            <span className="text-primary block mt-2">Land Your Dream Job</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track applications, manage contacts, prepare for interviews, and get AI-powered insights - all in one place.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="btn btn-primary text-lg px-8 py-4">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary text-lg px-8 py-4">
              Login
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Everything You Need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📋"
              title="Kanban Board"
              description="Visualize your job search pipeline with drag-and-drop cards"
            />
            <FeatureCard
              icon="🤖"
              title="AI-Powered Tools"
              description="Generate resumes, cover letters, and interview prep with AI"
            />
            <FeatureCard
              icon="📊"
              title="Analytics & Insights"
              description="Track your progress and optimize your job search strategy"
            />
            <FeatureCard
              icon="👥"
              title="Contact Management"
              description="Keep track of recruiters, hiring managers, and connections"
            />
            <FeatureCard
              icon="📅"
              title="Interview Scheduler"
              description="Never miss an interview with calendar integration"
            />
            <FeatureCard
              icon="📄"
              title="Document Storage"
              description="Store and version control your resumes and cover letters"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join thousands of job seekers organizing their search</p>
          <Link to="/register" className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card p-6 text-center hover:shadow-lg transition">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
```

**Update App.jsx routing:**
```javascript
<Route path="/" element={<Landing />} />
// Change protected route to start at /app
```

---

### 6. Settings Page

**Create:** `/client/src/pages/Settings.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    weeklyDigest: true,
    interviewReminders: true,
    deadlineReminders: true
  });
  
  const [integrations, setIntegrations] = useState({
    googleCalendar: false,
    googleOAuth: false
  });
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      {/* Profile Settings */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        {/* Form fields for profile */}
      </div>
      
      {/* Notification Preferences */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        {/* Checkboxes for notification preferences */}
      </div>
      
      {/* Integrations */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Google Calendar</h3>
              <p className="text-sm text-gray-600">Sync interviews to your calendar</p>
            </div>
            <button className="btn btn-primary">
              {integrations.googleCalendar ? 'Connected' : 'Connect'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Google OAuth</h3>
              <p className="text-sm text-gray-600">Sign in with Google</p>
            </div>
            <button className="btn btn-primary">
              {integrations.googleOAuth ? 'Connected' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="card p-6 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <button className="btn btn-danger">Delete Account</button>
      </div>
    </div>
  );
}
```

---

## Summary of Phase 2 Status

### ✅ Completed (100%)
1. **AI Resume Builder** - Full implementation with Claude API
2. **AI Cover Letter Generator** - Full implementation with Claude API
3. **AI Job Analysis** - Skill matching and insights
4. **AI Interview Prep** - Question generation and tips

### 🚧 Partially Complete (30%)
5. **Chrome Extension** - Manifest created, needs popup/content scripts

### ⏳ Not Started (0%)
6. **Calendar Integration** - Implementation guide provided
7. **Email Notifications** - Implementation guide provided
8. **Landing Page** - Implementation guide provided
9. **Settings Page** - Implementation guide provided

---

## Next Steps to Complete Phase 2

1. **Chrome Extension** (2-3 hours)
   - Create popup.html, popup.js, content.js
   - Test on LinkedIn, Indeed, Glassdoor
   - Package and test installation

2. **Calendar Integration** (2-3 hours)
   - Set up Google Calendar API
   - Implement OAuth flow
   - Add sync functionality

3. **Email Notifications** (3-4 hours)
   - Configure nodemailer
   - Create email templates
   - Set up cron jobs
   - Test email delivery

4. **Landing Page** (2-3 hours)
   - Build hero section
   - Add features showcase
   - Create pricing section (if needed)
   - Update routing

5. **Settings Page** (2-3 hours)
   - Profile management
   - Notification preferences
   - Integration toggles
   - Account deletion

**Total Estimated Time: 11-16 hours**

---

## Production Deployment Checklist

Before going to production:
- [ ] Set ANTHROPIC_API_KEY in production
- [ ] Configure Google OAuth credentials
- [ ] Set up production database
- [ ] Configure email SMTP settings
- [ ] Set up SSL/HTTPS
- [ ] Add rate limiting
- [ ] Implement error tracking (Sentry)
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Test all features end-to-end

