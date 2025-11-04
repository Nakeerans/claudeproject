# Intelligent Job Application Platform - System Architecture

## Executive Summary

This document outlines the complete system architecture for an AI-powered job application platform that combines:
- **Web Application**: Full-featured SaaS platform for job tracking and management
- **Chrome Extension**: Intelligent autofill with learning capabilities
- **Learning System**: Playwright-style recording that learns from manual user interactions
- **AI Engine**: Pattern recognition and automation for complex application flows

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├──────────────────────────┬──────────────────────────────────────┤
│   Web Application        │      Chrome Extension                │
│   (Next.js 14)           │      (Manifest V3)                   │
│                          │                                      │
│   - Dashboard            │   - Autofill Engine                  │
│   - Job Tracker          │   - Learning Mode                    │
│   - Profile Builder      │   - Recording System                 │
│   - Analytics            │   - Pattern Matcher                  │
│   - Documents            │   - Context Menu                     │
└──────────────────────────┴──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Node.js)                      │
│                      REST + WebSocket                           │
└─────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │  AI Engine   │
│   Database   │  │    Cache     │  │  (Claude AI) │
│              │  │              │  │              │
│ - Users      │  │ - Sessions   │  │ - Pattern    │
│ - Jobs       │  │ - Jobs       │  │   Analysis   │
│ - Apps       │  │ - Real-time  │  │ - Learning   │
│ - Patterns   │  │   Data       │  │ - Automation │
└──────────────┘  └──────────────┘  └──────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING SYSTEM                              │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Recorder    │→ │  Analyzer    │→ │  Generator   │        │
│  │              │  │              │  │              │        │
│  │ - DOM Events │  │ - Pattern    │  │ - Autofill   │        │
│  │ - User       │  │   Recognition│  │   Scripts    │        │
│  │   Actions    │  │ - AI Analysis│  │ - Test Cases │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

### 2.1 Web Application (Next.js 14 + TypeScript)

**Tech Stack**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query)
- Zustand (State Management)
- NextAuth.js (Authentication)

**Key Features**:
1. **Dashboard**: Application overview, stats, quick actions
2. **Job Tracker**: Kanban/List/Timeline views with drag-drop
3. **Profile Builder**: Multi-step form for user info
4. **Document Manager**: Resume/cover letter builder with AI
5. **Analytics**: Charts, insights, success predictions
6. **Company Research**: Search, filter, save companies
7. **Settings**: Autofill config, integrations, billing

**Directory Structure**:
```
job-application-platform/
├── apps/
│   └── web/                      # Next.js web app
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── register/
│       │   ├── (dashboard)/
│       │   │   ├── dashboard/
│       │   │   ├── jobs/
│       │   │   ├── applications/
│       │   │   ├── companies/
│       │   │   ├── documents/
│       │   │   ├── analytics/
│       │   │   └── settings/
│       │   ├── api/              # API routes
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/               # shadcn components
│       │   ├── features/         # Feature components
│       │   └── layouts/
│       ├── lib/
│       │   ├── hooks/
│       │   ├── utils/
│       │   └── services/
│       └── public/
├── apps/
│   └── extension/                # Chrome extension
│       ├── manifest.json
│       ├── background/
│       ├── content/
│       ├── popup/
│       └── options/
├── packages/
│   ├── api/                      # Backend API
│   ├── database/                 # Prisma schema
│   ├── shared/                   # Shared types
│   └── ui/                       # Shared components
└── tools/
    └── learning-engine/          # Learning system
```

---

### 2.2 Chrome Extension (Manifest V3)

**Capabilities**:
1. **Intelligent Autofill**: Context-aware form filling
2. **Learning Mode**: Record user actions like Playwright codegen
3. **Pattern Matching**: Recognize application form structures
4. **Career Page Onboarding**: Extract jobs from company career pages
5. **Stuck Detection**: Identify when automation fails, switch to manual mode
6. **Manual Learning**: Record manual completion steps for future automation

**Extension Architecture**:
```javascript
// manifest.json
{
  "manifest_version": 3,
  "name": "JobFlow - Intelligent Application Assistant",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "webNavigation",
    "contextMenus"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["recorder.js", "autofill.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**Key Extension Files**:

1. **background.js** (Service Worker):
   - Manages extension lifecycle
   - Handles API communication
   - Stores learned patterns
   - Coordinates between tabs

2. **content.js** (Content Script):
   - Injected into every page
   - Detects application forms
   - Shows autofill UI overlay
   - Captures DOM events for learning

3. **recorder.js** (Learning Module):
   - Records user interactions (clicks, typing, navigation)
   - Generates selector strategies
   - Creates replayable action sequences
   - Sends data to backend for AI analysis

4. **autofill.js** (Automation Engine):
   - Fills forms using learned patterns
   - Handles dynamic fields
   - Detects when automation gets stuck
   - Falls back to manual mode with recording

5. **popup.html** (Extension UI):
   - Quick actions (autofill, record, save job)
   - Current page analysis
   - Profile selection
   - Settings

---

### 2.3 Learning System (Playwright-Style Recording)

**How It Works**:

```
User Interaction Flow:
1. User clicks "Add Company Career Page" in web app
2. Extension enters "Learning Mode" on career page
3. User manually navigates and fills application form
4. Extension records every action:
   - Mouse clicks → element selectors
   - Keyboard input → field mappings
   - Navigation → page flow
   - Waits → timing patterns
5. When stuck, user completes manually → extension learns
6. AI analyzes recording → generates automation script
7. Next time, extension auto-fills using learned pattern
```

**Recording Data Structure**:
```typescript
interface RecordedSession {
  id: string;
  companyUrl: string;
  startTime: Date;
  endTime: Date;
  actions: RecordedAction[];
  pageSnapshots: PageSnapshot[];
  success: boolean;
  metadata: {
    browser: string;
    userAgent: string;
    viewport: { width: number; height: number };
  };
}

interface RecordedAction {
  id: string;
  timestamp: number;
  type: 'click' | 'type' | 'navigate' | 'select' | 'upload' | 'wait';
  target: ElementSelector;
  value?: string;
  pageUrl: string;
  screenshot?: string; // Base64 screenshot
  context: {
    beforeHtml: string;   // DOM state before action
    afterHtml: string;    // DOM state after action
    visibleText: string;  // User-visible text
  };
}

interface ElementSelector {
  // Multiple selector strategies for robustness
  strategies: {
    id?: string;
    dataTestId?: string;
    ariaLabel?: string;
    placeholder?: string;
    name?: string;
    cssSelector?: string;
    xpath?: string;
    textContent?: string;
  };
  recommendedStrategy: string; // Which one to use first
  fallbackStrategies: string[]; // Ordered fallbacks
}

interface PageSnapshot {
  url: string;
  timestamp: number;
  html: string;
  screenshot: string;
  detectedForms: DetectedForm[];
}

interface DetectedForm {
  formSelector: string;
  fields: FormField[];
  submitButton: ElementSelector;
  formType: 'job_application' | 'contact' | 'login' | 'unknown';
  confidence: number; // AI confidence score
}

interface FormField {
  selector: ElementSelector;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  mappedTo?: string; // Which user profile field to use (e.g., 'firstName', 'email')
  confidence: number; // AI confidence for mapping
}
```

**Learning Engine Flow**:
```typescript
// 1. RECORDER (Chrome Extension - recorder.js)
class InteractionRecorder {
  private session: RecordedSession;
  private isRecording: boolean = false;

  startRecording(companyUrl: string) {
    this.session = {
      id: crypto.randomUUID(),
      companyUrl,
      startTime: new Date(),
      actions: [],
      pageSnapshots: []
    };

    // Attach listeners
    this.attachClickListener();
    this.attachInputListener();
    this.attachNavigationListener();
    this.isRecording = true;
  }

  private attachClickListener() {
    document.addEventListener('click', async (e) => {
      if (!this.isRecording) return;

      const target = e.target as HTMLElement;
      const selector = this.generateSelector(target);

      // Capture before state
      const beforeHtml = document.documentElement.outerHTML;

      // Record action
      this.session.actions.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'click',
        target: selector,
        pageUrl: window.location.href,
        context: {
          beforeHtml,
          visibleText: target.innerText || target.textContent || '',
          afterHtml: '' // Will be captured after action completes
        }
      });

      // Capture after state (wait for DOM to settle)
      await this.waitForDOMSettled();
      const lastAction = this.session.actions[this.session.actions.length - 1];
      lastAction.context.afterHtml = document.documentElement.outerHTML;
    }, true);
  }

  private generateSelector(element: HTMLElement): ElementSelector {
    return {
      strategies: {
        id: element.id || undefined,
        dataTestId: element.getAttribute('data-testid') || undefined,
        ariaLabel: element.getAttribute('aria-label') || undefined,
        placeholder: element.getAttribute('placeholder') || undefined,
        name: element.getAttribute('name') || undefined,
        cssSelector: this.generateCSSSelector(element),
        xpath: this.generateXPath(element),
        textContent: element.textContent?.trim() || undefined
      },
      recommendedStrategy: element.id ? 'id' :
                          element.getAttribute('data-testid') ? 'dataTestId' :
                          element.getAttribute('aria-label') ? 'ariaLabel' :
                          'cssSelector',
      fallbackStrategies: ['cssSelector', 'xpath', 'textContent']
    };
  }

  async stopRecording() {
    this.isRecording = false;
    this.session.endTime = new Date();

    // Send to backend for AI analysis
    await this.sendToBackend();
  }

  private async sendToBackend() {
    await fetch('https://api.yourapp.com/v1/learning/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.session)
    });
  }
}

// 2. ANALYZER (Backend - AI-powered pattern recognition)
class PatternAnalyzer {
  async analyzeSession(session: RecordedSession): Promise<ApplicationPattern> {
    // Use AI to understand the recorded session
    const analysis = await this.analyzeWithAI(session);

    return {
      companyDomain: new URL(session.companyUrl).hostname,
      formStructure: analysis.formStructure,
      fieldMappings: analysis.fieldMappings,
      navigationFlow: analysis.navigationFlow,
      automationScript: this.generateAutomationScript(analysis),
      confidence: analysis.confidence
    };
  }

  private async analyzeWithAI(session: RecordedSession) {
    // Send to Claude AI for analysis
    const prompt = `
Analyze this recorded job application session and extract:
1. Form structure (multi-page vs single-page)
2. Field mappings (which form fields map to user profile data)
3. Navigation flow (page sequence, buttons to click)
4. Special cases (file uploads, conditional fields, CAPTCHAs)

Session data:
${JSON.stringify(session, null, 2)}

Return structured JSON with field mappings and automation steps.
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text);
  }

  private generateAutomationScript(analysis: any): AutomationScript {
    // Convert AI analysis into executable automation steps
    return {
      steps: analysis.navigationFlow.map(step => ({
        type: step.actionType,
        selector: step.elementSelector,
        value: step.value,
        waitCondition: step.waitFor
      })),
      fieldMappings: analysis.fieldMappings,
      fallbackStrategy: 'manual_with_recording'
    };
  }
}

interface ApplicationPattern {
  id: string;
  companyDomain: string;
  formStructure: {
    type: 'single-page' | 'multi-page' | 'wizard';
    pageCount: number;
    pages: PagePattern[];
  };
  fieldMappings: FieldMapping[];
  navigationFlow: NavigationStep[];
  automationScript: AutomationScript;
  confidence: number;
  successCount: number;
  failureCount: number;
  lastUsed: Date;
}

interface FieldMapping {
  formFieldSelector: ElementSelector;
  profileField: string; // e.g., 'firstName', 'email', 'resume'
  transform?: string; // Optional transformation function
  confidence: number;
}

interface NavigationStep {
  order: number;
  pageUrl: string;
  action: 'click' | 'type' | 'select' | 'upload' | 'wait';
  selector: ElementSelector;
  value?: string;
  waitCondition?: {
    type: 'navigation' | 'element' | 'timeout';
    selector?: string;
    timeout: number;
  };
}

interface AutomationScript {
  steps: AutomationStep[];
  fieldMappings: FieldMapping[];
  fallbackStrategy: 'manual_with_recording' | 'pause_and_notify';
}

// 3. AUTOMATION ENGINE (Chrome Extension - autofill.js)
class AutofillEngine {
  async autofillApplication(
    companyUrl: string,
    userProfile: UserProfile
  ): Promise<AutofillResult> {

    // Fetch learned pattern for this company
    const pattern = await this.fetchPattern(companyUrl);

    if (!pattern || pattern.confidence < 0.7) {
      return {
        success: false,
        reason: 'no_pattern',
        action: 'start_learning_mode'
      };
    }

    // Execute automation script
    try {
      for (const step of pattern.automationScript.steps) {
        const success = await this.executeStep(step, userProfile);

        if (!success) {
          // Automation stuck - switch to manual mode with recording
          return {
            success: false,
            reason: 'automation_stuck',
            stuckAt: step,
            action: 'manual_mode_with_learning'
          };
        }
      }

      return {
        success: true,
        reason: 'completed',
        action: 'none'
      };

    } catch (error) {
      return {
        success: false,
        reason: 'error',
        error: error.message,
        action: 'manual_mode_with_learning'
      };
    }
  }

  private async executeStep(
    step: AutomationStep,
    profile: UserProfile
  ): Promise<boolean> {
    const element = await this.findElement(step.selector);

    if (!element) {
      console.warn('Element not found:', step.selector);
      return false;
    }

    // Check if element is visible and interactable
    if (!this.isElementInteractable(element)) {
      console.warn('Element not interactable:', step.selector);
      return false;
    }

    // Execute action
    switch (step.action) {
      case 'click':
        element.click();
        break;
      case 'type':
        const value = this.getProfileValue(step.profileField, profile);
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      case 'select':
        // Handle select dropdowns
        break;
      case 'upload':
        // Trigger file upload flow
        break;
    }

    // Wait for condition
    if (step.waitCondition) {
      await this.waitForCondition(step.waitCondition);
    }

    return true;
  }

  private async findElement(selector: ElementSelector): Promise<HTMLElement | null> {
    // Try recommended strategy first
    const strategies = [
      selector.recommendedStrategy,
      ...selector.fallbackStrategies
    ];

    for (const strategy of strategies) {
      const element = this.findByStrategy(strategy, selector);
      if (element) return element;
    }

    return null;
  }
}
```

---

### 2.4 Career Page Onboarding Feature

**User Flow**:
```
1. User goes to web app → "Add Company" page
2. Enters company career page URL (e.g., https://jobs.lever.co/company)
3. Clicks "Start Onboarding"
4. Extension opens career page in new tab
5. Extension analyzes page structure:
   - Detects job listings
   - Extracts job titles, locations, types
   - Identifies "Apply" buttons
6. Shows preview in web app: "Found 15 jobs at Company X"
7. User clicks job to apply
8. Extension navigates to application form
9. Two scenarios:

   A) AUTOMATED (Pattern exists):
      - Extension auto-fills form
      - Shows progress: "Filling field 3/12..."
      - If stuck → switch to Manual Mode

   B) MANUAL (No pattern):
      - Extension enters "Learning Mode"
      - Shows banner: "🔴 Recording - Complete application manually"
      - User fills form manually
      - Extension records every action
      - When submitted → saves pattern for next time
```

**Implementation**:
```typescript
// Career Page Scraper
class CareerPageScraper {
  async scrapeCareerPage(url: string): Promise<CompanyJobs> {
    const html = await fetch(url).then(r => r.text());

    // Use AI to extract job listings (handles different ATS formats)
    const jobs = await this.extractJobsWithAI(html);

    return {
      companyName: jobs.companyName,
      careerPageUrl: url,
      atsProvider: this.detectATS(url, html), // Lever, Greenhouse, Workday, etc.
      jobs: jobs.listings.map(job => ({
        title: job.title,
        location: job.location,
        type: job.type,
        applyUrl: job.applyUrl,
        postedDate: job.postedDate,
        description: job.description
      }))
    };
  }

  private detectATS(url: string, html: string): string {
    if (url.includes('lever.co')) return 'Lever';
    if (url.includes('greenhouse.io')) return 'Greenhouse';
    if (url.includes('myworkdayjobs.com')) return 'Workday';
    if (html.includes('ashbyhq')) return 'Ashby';
    if (html.includes('breezy')) return 'BreezyHR';
    return 'Custom';
  }

  private async extractJobsWithAI(html: string) {
    // Use Claude to extract jobs from any career page format
    const prompt = `
Extract all job listings from this career page HTML.
Return JSON array with: title, location, type, applyUrl, postedDate, description

HTML:
${html.substring(0, 50000)} // Truncate for token limits
    `;

    // ... Claude API call
  }
}
```

---

## 3. Database Schema (PostgreSQL + Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH ====================
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  avatar        String?
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       UserProfile?
  applications  Application[]
  companies     Company[]
  documents     Document[]
  sessions      RecordedSession[]

  @@index([email])
}

enum Plan {
  FREE
  PREMIUM
  ENTERPRISE
}

// ==================== USER PROFILE ====================
model UserProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Basic Info
  firstName     String
  lastName      String
  email         String
  phone         String?
  location      String?
  website       String?
  linkedin      String?
  github        String?

  // Professional Info
  headline      String?
  summary       String?
  yearsOfExp    Int?
  currentTitle  String?
  currentCompany String?
  desiredRoles  String[]
  desiredLocations String[]
  workAuthorization String?
  sponsorshipRequired Boolean @default(false)

  // Education
  education     Json[] // Array of education objects

  // Experience
  experience    Json[] // Array of experience objects

  // Skills
  skills        String[]
  certifications String[]
  languages     String[]

  // Preferences
  jobTypes      String[] // Full-time, Part-time, Contract, etc.
  remotePreference String? // Remote, Hybrid, Onsite
  salaryMin     Int?
  salaryMax     Int?

  // Documents
  resumeId      String?
  coverLetterId String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}

// ==================== JOBS & APPLICATIONS ====================
model Company {
  id            String   @id @default(cuid())
  name          String
  domain        String   @unique
  logo          String?
  description   String?
  industry      String?
  size          String?
  location      String?
  careerPageUrl String?
  atsProvider   String?  // Lever, Greenhouse, etc.

  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  jobs          Job[]
  applications  Application[]
  patterns      ApplicationPattern[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([domain])
  @@index([userId])
}

model Job {
  id            String   @id @default(cuid())
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  title         String
  location      String?
  type          String?  // Full-time, Part-time, etc.
  salary        String?
  description   String?
  requirements  String?
  applyUrl      String
  postedDate    DateTime?
  expiresDate   DateTime?

  applications  Application[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([companyId])
  @@index([title])
}

model Application {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobId         String?
  job           Job?     @relation(fields: [jobId], references: [id], onDelete: SetNull)
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Application Details
  jobTitle      String
  status        ApplicationStatus @default(SAVED)
  priority      Int      @default(0)
  isFavorite    Boolean  @default(false)

  // Dates
  appliedDate   DateTime?
  responseDate  DateTime?
  interviewDate DateTime?
  offerDate     DateTime?

  // Links
  applicationUrl String?
  jobPostingUrl  String

  // Documents used
  resumeId      String?
  coverLetterId String?

  // Notes & Communication
  notes         String?
  contacts      Json[] // Array of contact objects
  timeline      ApplicationEvent[]

  // Automation
  autoFilled    Boolean  @default(false)
  patternId     String?
  pattern       ApplicationPattern? @relation(fields: [patternId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([appliedDate])
}

enum ApplicationStatus {
  SAVED
  APPLYING
  APPLIED
  SCREENING
  INTERVIEWING
  OFFER
  ACCEPTED
  REJECTED
  WITHDRAWN
}

model ApplicationEvent {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  type          String // status_change, note_added, email_sent, interview_scheduled, etc.
  title         String
  description   String?
  metadata      Json?

  createdAt     DateTime @default(now())

  @@index([applicationId])
}

// ==================== DOCUMENTS ====================
model Document {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String
  type          DocumentType
  fileUrl       String?  // S3 URL
  content       Json?    // Structured content for AI generation

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([type])
}

enum DocumentType {
  RESUME
  COVER_LETTER
  PORTFOLIO
  TRANSCRIPT
  OTHER
}

// ==================== LEARNING SYSTEM ====================
model RecordedSession {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyUrl    String
  companyDomain String
  startTime     DateTime
  endTime       DateTime?

  actions       Json[] // Array of RecordedAction
  pageSnapshots Json[] // Array of PageSnapshot

  success       Boolean  @default(false)
  analyzed      Boolean  @default(false)

  metadata      Json?

  patternId     String?
  pattern       ApplicationPattern? @relation(fields: [patternId], references: [id])

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([companyDomain])
}

model ApplicationPattern {
  id            String   @id @default(cuid())
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  companyDomain String
  atsProvider   String?

  formStructure Json // PagePattern structure
  fieldMappings Json[] // FieldMapping array
  navigationFlow Json[] // NavigationStep array
  automationScript Json // AutomationScript

  confidence    Float    @default(0.0)
  successCount  Int      @default(0)
  failureCount  Int      @default(0)
  lastUsed      DateTime?

  applications  Application[]
  sessions      RecordedSession[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([companyDomain])
  @@index([companyId])
}
```

---

## 4. API Endpoints

### 4.1 Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
POST   /api/auth/refresh
```

### 4.2 User Profile
```
GET    /api/profile
PUT    /api/profile
GET    /api/profile/autofill-data
```

### 4.3 Jobs & Companies
```
GET    /api/companies
POST   /api/companies
GET    /api/companies/:id
PUT    /api/companies/:id
DELETE /api/companies/:id

GET    /api/jobs
GET    /api/jobs/:id
POST   /api/jobs/scrape-career-page
```

### 4.4 Applications
```
GET    /api/applications
POST   /api/applications
GET    /api/applications/:id
PUT    /api/applications/:id
DELETE /api/applications/:id
PATCH  /api/applications/:id/status
POST   /api/applications/:id/notes
```

### 4.5 Documents
```
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/generate-resume
POST   /api/documents/upload
```

### 4.6 Learning System
```
POST   /api/learning/sessions
GET    /api/learning/sessions/:id
POST   /api/learning/sessions/:id/analyze
GET    /api/learning/patterns
GET    /api/learning/patterns/:companyDomain
POST   /api/learning/patterns/:id/test
```

### 4.7 Extension API
```
GET    /api/extension/autofill-data
GET    /api/extension/pattern/:companyDomain
POST   /api/extension/log-action
POST   /api/extension/report-stuck
```

---

## 5. Chrome Extension Detailed Implementation

### 5.1 Manifest V3 Setup
```json
{
  "manifest_version": 3,
  "name": "JobFlow - Intelligent Application Assistant",
  "version": "1.0.0",
  "description": "AI-powered job application autofill that learns from your actions",

  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "tabs",
    "webNavigation",
    "contextMenus"
  ],

  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },

  "options_page": "options.html",

  "web_accessible_resources": [
    {
      "resources": [
        "recorder.js",
        "autofill.js",
        "icons/*"
      ],
      "matches": ["<all_urls>"]
    }
  ],

  "commands": {
    "toggle-autofill": {
      "suggested_key": {
        "default": "Ctrl+Shift+A",
        "mac": "Command+Shift+A"
      },
      "description": "Toggle autofill mode"
    },
    "start-recording": {
      "suggested_key": {
        "default": "Ctrl+Shift+R",
        "mac": "Command+Shift+R"
      },
      "description": "Start recording session"
    }
  }
}
```

### 5.2 Background Service Worker (background.js)
```typescript
// background.js
import { API_BASE_URL } from './config';

// State management
let currentSession: RecordedSession | null = null;
let isRecording = false;
let userProfile: UserProfile | null = null;

// Install event
chrome.runtime.onInstalled.addListener(async () => {
  console.log('JobFlow extension installed');

  // Create context menu
  chrome.contextMenus.create({
    id: 'jobflow-autofill',
    title: 'JobFlow: Autofill this form',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'jobflow-record',
    title: 'JobFlow: Start recording',
    contexts: ['page']
  });

  // Fetch user profile
  await fetchUserProfile();
});

// Context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'jobflow-autofill') {
    startAutofill(tab.id);
  } else if (info.menuItemId === 'jobflow-record') {
    startRecording(tab.id);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'FORM_DETECTED':
      handleFormDetected(message.data, sender.tab);
      break;
    case 'RECORD_ACTION':
      handleRecordAction(message.data);
      break;
    case 'AUTOFILL_STUCK':
      handleAutofillStuck(message.data, sender.tab);
      break;
    case 'GET_USER_PROFILE':
      sendResponse({ profile: userProfile });
      break;
  }
  return true; // Keep channel open for async response
});

// Fetch user profile from API
async function fetchUserProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/autofill-data`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });
    userProfile = await response.json();
    chrome.storage.local.set({ userProfile });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
}

// Get auth token from storage
async function getAuthToken(): Promise<string> {
  const result = await chrome.storage.local.get('authToken');
  return result.authToken || '';
}

// Start autofill on current page
async function startAutofill(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  const domain = new URL(tab.url).hostname;

  // Fetch pattern for this domain
  const pattern = await fetchPattern(domain);

  if (!pattern || pattern.confidence < 0.7) {
    // No pattern - suggest recording
    chrome.tabs.sendMessage(tabId, {
      type: 'NO_PATTERN',
      message: 'No autofill pattern found. Start recording to teach me!'
    });
    return;
  }

  // Send autofill command to content script
  chrome.tabs.sendMessage(tabId, {
    type: 'START_AUTOFILL',
    pattern,
    userProfile
  });
}

// Fetch autofill pattern for domain
async function fetchPattern(domain: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/extension/pattern/${encodeURIComponent(domain)}`,
      {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch pattern:', error);
    return null;
  }
}

// Start recording session
async function startRecording(tabId: number) {
  if (isRecording) {
    await stopRecording();
  }

  const tab = await chrome.tabs.get(tabId);

  currentSession = {
    id: crypto.randomUUID(),
    companyUrl: tab.url,
    companyDomain: new URL(tab.url).hostname,
    startTime: new Date(),
    actions: [],
    pageSnapshots: [],
    success: false
  };

  isRecording = true;

  // Notify content script
  chrome.tabs.sendMessage(tabId, {
    type: 'START_RECORDING',
    sessionId: currentSession.id
  });

  // Show recording badge
  chrome.action.setBadgeText({ text: '🔴', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000', tabId });
}

// Stop recording session
async function stopRecording() {
  if (!currentSession) return;

  currentSession.endTime = new Date();
  isRecording = false;

  // Send session to backend for analysis
  await fetch(`${API_BASE_URL}/api/learning/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(currentSession)
  });

  // Clear badge
  chrome.action.setBadgeText({ text: '' });

  currentSession = null;
}

// Handle recorded action from content script
function handleRecordAction(action: RecordedAction) {
  if (!isRecording || !currentSession) return;

  currentSession.actions.push(action);
}

// Handle autofill stuck
async function handleAutofillStuck(data: any, tab: chrome.tabs.Tab) {
  // Log stuck event
  await fetch(`${API_BASE_URL}/api/extension/report-stuck`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify({
      companyDomain: new URL(tab.url).hostname,
      stuckAt: data.step,
      pageUrl: tab.url
    })
  });

  // Start recording to learn
  await startRecording(tab.id);

  // Notify user
  chrome.tabs.sendMessage(tab.id, {
    type: 'AUTOFILL_STUCK_NOTIFICATION',
    message: 'Automation stuck. Switched to learning mode - please complete manually.'
  });
}

// Handle form detected
function handleFormDetected(formData: any, tab: chrome.tabs.Tab) {
  // Show page action badge
  chrome.action.setBadgeText({ text: '📝', tabId: tab.id });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tab.id });
}
```

### 5.3 Content Script (content.js)
```typescript
// content.js
import { InteractionRecorder } from './recorder';
import { AutofillEngine } from './autofill';

let recorder: InteractionRecorder;
let autofillEngine: AutofillEngine;
let isRecordingMode = false;
let isAutofillMode = false;

// Initialize
(function init() {
  recorder = new InteractionRecorder();
  autofillEngine = new AutofillEngine();

  // Detect forms on page
  detectForms();

  // Listen for dynamic content
  observeDOMChanges();

  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleMessage);
})();

// Detect job application forms
function detectForms() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    const fields = form.querySelectorAll('input, textarea, select');

    // Heuristic: likely job application if has email + resume upload
    const hasEmail = Array.from(fields).some(f =>
      f.type === 'email' || f.name?.includes('email')
    );
    const hasFileUpload = Array.from(fields).some(f =>
      f.type === 'file'
    );

    if (hasEmail && hasFileUpload) {
      // Likely job application form
      chrome.runtime.sendMessage({
        type: 'FORM_DETECTED',
        data: {
          formSelector: getSelector(form),
          fieldCount: fields.length
        }
      });

      // Show autofill button
      showAutofillButton(form);
    }
  });
}

// Show autofill button overlay
function showAutofillButton(form: HTMLFormElement) {
  const button = document.createElement('button');
  button.id = 'jobflow-autofill-btn';
  button.innerHTML = '⚡ JobFlow: Autofill this form';
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
    transition: transform 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerHTML = '⏳ Autofilling...';

    // Request user profile
    const response = await chrome.runtime.sendMessage({
      type: 'GET_USER_PROFILE'
    });

    if (response.profile) {
      await autofillEngine.autofillForm(form, response.profile);
      button.innerHTML = '✅ Autofilled!';
      setTimeout(() => button.remove(), 2000);
    } else {
      button.innerHTML = '❌ Please login to web app';
      button.disabled = false;
    }
  });

  // Only add if not already present
  if (!document.getElementById('jobflow-autofill-btn')) {
    document.body.appendChild(button);
  }
}

// Handle messages from background
function handleMessage(message: any) {
  switch (message.type) {
    case 'START_RECORDING':
      startRecordingMode(message.sessionId);
      break;
    case 'STOP_RECORDING':
      stopRecordingMode();
      break;
    case 'START_AUTOFILL':
      startAutofillMode(message.pattern, message.userProfile);
      break;
    case 'NO_PATTERN':
      showNoPatternNotification(message.message);
      break;
    case 'AUTOFILL_STUCK_NOTIFICATION':
      showStuckNotification(message.message);
      break;
  }
}

// Start recording mode
function startRecordingMode(sessionId: string) {
  isRecordingMode = true;
  recorder.startRecording(sessionId);

  // Show recording banner
  showBanner('🔴 Recording - Complete the application manually', 'red');
}

// Stop recording mode
function stopRecordingMode() {
  isRecordingMode = false;
  recorder.stopRecording();

  removeBanner();
}

// Start autofill mode
async function startAutofillMode(pattern: ApplicationPattern, profile: UserProfile) {
  isAutofillMode = true;

  showBanner('⚡ Autofilling application...', 'blue');

  const result = await autofillEngine.autofillApplication(pattern, profile);

  if (result.success) {
    showBanner('✅ Application autofilled successfully!', 'green');
    setTimeout(removeBanner, 3000);
  } else {
    if (result.action === 'manual_mode_with_learning') {
      // Switch to recording mode
      showStuckNotification('Automation stuck. Please complete manually - I\'ll learn!');
      chrome.runtime.sendMessage({
        type: 'AUTOFILL_STUCK',
        data: { step: result.stuckAt }
      });
    }
  }

  isAutofillMode = false;
}

// Show banner notification
function showBanner(message: string, color: string) {
  removeBanner(); // Remove existing

  const banner = document.createElement('div');
  banner.id = 'jobflow-banner';
  banner.textContent = message;
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999999;
    padding: 16px;
    background: ${color === 'red' ? '#f44336' : color === 'green' ? '#4CAF50' : '#2196F3'};
    color: white;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(banner);
}

// Remove banner
function removeBanner() {
  const banner = document.getElementById('jobflow-banner');
  if (banner) banner.remove();
}

// Observe DOM changes for SPAs
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    // Debounce form detection
    clearTimeout(window['formDetectionTimeout']);
    window['formDetectionTimeout'] = setTimeout(() => {
      detectForms();
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Helper: Generate CSS selector for element
function getSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${element.className.split(' ').join('.')}`;

  let path = [];
  while (element.parentElement) {
    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    } else {
      let sibling = element;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.tagName === element.tagName) nth++;
      }
      if (nth > 1) selector += `:nth-of-type(${nth})`;
    }
    path.unshift(selector);
    element = element.parentElement;
  }
  return path.join(' > ');
}
```

### 5.4 Recorder Module (recorder.js)
```typescript
// recorder.js
export class InteractionRecorder {
  private sessionId: string | null = null;
  private actions: RecordedAction[] = [];
  private isRecording = false;

  startRecording(sessionId: string) {
    this.sessionId = sessionId;
    this.actions = [];
    this.isRecording = true;

    this.attachListeners();
  }

  stopRecording() {
    this.isRecording = false;
    this.removeListeners();

    // Send to background
    chrome.runtime.sendMessage({
      type: 'RECORDING_COMPLETE',
      data: {
        sessionId: this.sessionId,
        actions: this.actions
      }
    });
  }

  private attachListeners() {
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
  }

  private removeListeners() {
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
  }

  private handleClick = async (e: MouseEvent) => {
    if (!this.isRecording) return;

    const target = e.target as HTMLElement;

    // Skip if clicking on JobFlow UI
    if (target.closest('#jobflow-autofill-btn, #jobflow-banner')) return;

    const action: RecordedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'click',
      target: this.generateSelector(target),
      pageUrl: window.location.href,
      context: {
        beforeHtml: document.documentElement.outerHTML.substring(0, 10000),
        visibleText: target.innerText || target.textContent || '',
        afterHtml: '' // Will be captured after DOM settles
      }
    };

    this.actions.push(action);

    // Capture after state
    await this.waitForDOMSettled();
    action.context.afterHtml = document.documentElement.outerHTML.substring(0, 10000);

    // Send to background
    chrome.runtime.sendMessage({
      type: 'RECORD_ACTION',
      data: action
    });
  };

  private handleInput = (e: Event) => {
    if (!this.isRecording) return;

    const target = e.target as HTMLInputElement;

    const action: RecordedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'type',
      target: this.generateSelector(target),
      value: target.value,
      pageUrl: window.location.href,
      context: {
        beforeHtml: '',
        visibleText: '',
        afterHtml: ''
      }
    };

    this.actions.push(action);

    chrome.runtime.sendMessage({
      type: 'RECORD_ACTION',
      data: action
    });
  };

  private handleChange = (e: Event) => {
    if (!this.isRecording) return;

    const target = e.target as HTMLSelectElement | HTMLInputElement;

    const action: RecordedAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: target.tagName === 'SELECT' ? 'select' : 'change',
      target: this.generateSelector(target),
      value: target.value,
      pageUrl: window.location.href,
      context: {
        beforeHtml: '',
        visibleText: '',
        afterHtml: ''
      }
    };

    this.actions.push(action);

    chrome.runtime.sendMessage({
      type: 'RECORD_ACTION',
      data: action
    });
  };

  private generateSelector(element: HTMLElement): ElementSelector {
    return {
      strategies: {
        id: element.id || undefined,
        dataTestId: element.getAttribute('data-testid') || undefined,
        ariaLabel: element.getAttribute('aria-label') || undefined,
        placeholder: element.getAttribute('placeholder') || undefined,
        name: element.getAttribute('name') || undefined,
        cssSelector: this.getCSSSelector(element),
        xpath: this.getXPath(element),
        textContent: element.textContent?.trim().substring(0, 100) || undefined
      },
      recommendedStrategy: element.id ? 'id' :
                          element.getAttribute('data-testid') ? 'dataTestId' :
                          element.getAttribute('name') ? 'name' :
                          'cssSelector',
      fallbackStrategies: ['cssSelector', 'xpath']
    };
  }

  private getCSSSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;

    let path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className) {
        selector += '.' + Array.from(current.classList).join('.');
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  private getXPath(element: HTMLElement): string {
    if (element.id) return `//*[@id="${element.id}"]`;

    let path = '';
    let current: Element | null = element;

    while (current && current !== document.body) {
      let index = 0;
      let sibling: Element | null = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const nth = index > 0 ? `[${index + 1}]` : '';
      path = `/${tagName}${nth}${path}`;

      current = current.parentElement;
    }

    return path;
  }

  private async waitForDOMSettled(): Promise<void> {
    return new Promise(resolve => {
      let timeout: any;
      const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 300);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 2000);
    });
  }
}
```

### 5.5 Autofill Engine (autofill.js)
```typescript
// autofill.js
export class AutofillEngine {
  async autofillForm(form: HTMLFormElement, profile: UserProfile): Promise<void> {
    const fields = form.querySelectorAll('input, textarea, select');

    for (const field of Array.from(fields) as HTMLInputElement[]) {
      await this.fillField(field, profile);
    }
  }

  async autofillApplication(
    pattern: ApplicationPattern,
    profile: UserProfile
  ): Promise<AutofillResult> {
    try {
      for (const step of pattern.automationScript.steps) {
        const success = await this.executeStep(step, profile);

        if (!success) {
          return {
            success: false,
            reason: 'automation_stuck',
            stuckAt: step,
            action: 'manual_mode_with_learning'
          };
        }

        // Wait between steps
        await this.sleep(500);
      }

      return {
        success: true,
        reason: 'completed',
        action: 'none'
      };

    } catch (error) {
      return {
        success: false,
        reason: 'error',
        error: error.message,
        action: 'manual_mode_with_learning'
      };
    }
  }

  private async executeStep(
    step: AutomationStep,
    profile: UserProfile
  ): Promise<boolean> {
    const element = await this.findElement(step.selector);

    if (!element || !this.isElementInteractable(element)) {
      return false;
    }

    switch (step.action) {
      case 'click':
        element.click();
        break;

      case 'type':
        const value = this.getProfileValue(step.profileField, profile);
        await this.typeIntoField(element as HTMLInputElement, value);
        break;

      case 'select':
        (element as HTMLSelectElement).value =
          this.getProfileValue(step.profileField, profile);
        element.dispatchEvent(new Event('change', { bubbles: true }));
        break;

      case 'upload':
        // File uploads require user interaction - can't be automated
        return false;
    }

    // Wait for condition
    if (step.waitCondition) {
      await this.waitForCondition(step.waitCondition);
    }

    return true;
  }

  private async findElement(selector: ElementSelector): Promise<HTMLElement | null> {
    const strategies = [
      selector.recommendedStrategy,
      ...selector.fallbackStrategies
    ];

    for (const strategy of strategies) {
      const element = this.findByStrategy(strategy, selector);
      if (element) return element as HTMLElement;
    }

    return null;
  }

  private findByStrategy(strategy: string, selector: ElementSelector): Element | null {
    const strat = selector.strategies[strategy];
    if (!strat) return null;

    switch (strategy) {
      case 'id':
        return document.getElementById(strat);
      case 'dataTestId':
        return document.querySelector(`[data-testid="${strat}"]`);
      case 'ariaLabel':
        return document.querySelector(`[aria-label="${strat}"]`);
      case 'name':
        return document.querySelector(`[name="${strat}"]`);
      case 'cssSelector':
        return document.querySelector(strat);
      case 'xpath':
        return document.evaluate(
          strat,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as Element;
      default:
        return null;
    }
  }

  private isElementInteractable(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      window.getComputedStyle(element).visibility !== 'hidden' &&
      window.getComputedStyle(element).display !== 'none'
    );
  }

  private getProfileValue(fieldName: string, profile: UserProfile): string {
    const mapping: Record<string, any> = {
      'firstName': profile.firstName,
      'lastName': profile.lastName,
      'fullName': `${profile.firstName} ${profile.lastName}`,
      'email': profile.email,
      'phone': profile.phone,
      'location': profile.location,
      'linkedin': profile.linkedin,
      'github': profile.github,
      'website': profile.website,
      // ... more mappings
    };

    return mapping[fieldName] || '';
  }

  private async fillField(field: HTMLInputElement, profile: UserProfile) {
    const fieldType = this.detectFieldType(field);
    const value = this.getValueForFieldType(fieldType, profile);

    if (value) {
      await this.typeIntoField(field, value);
    }
  }

  private detectFieldType(field: HTMLInputElement): string {
    // Check various attributes
    const name = field.name?.toLowerCase() || '';
    const placeholder = field.placeholder?.toLowerCase() || '';
    const label = this.getFieldLabel(field)?.toLowerCase() || '';
    const type = field.type;

    const combined = `${name} ${placeholder} ${label}`;

    if (type === 'email' || combined.includes('email')) return 'email';
    if (combined.includes('first') && combined.includes('name')) return 'firstName';
    if (combined.includes('last') && combined.includes('name')) return 'lastName';
    if (combined.includes('phone') || combined.includes('mobile')) return 'phone';
    if (combined.includes('linkedin')) return 'linkedin';
    if (combined.includes('github')) return 'github';
    if (combined.includes('website') || combined.includes('portfolio')) return 'website';
    if (combined.includes('location') || combined.includes('city')) return 'location';

    return 'unknown';
  }

  private getFieldLabel(field: HTMLElement): string | null {
    // Try to find associated label
    const id = field.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent;
    }

    // Check parent label
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent;

    return null;
  }

  private getValueForFieldType(fieldType: string, profile: UserProfile): string {
    const mapping: Record<string, string> = {
      'email': profile.email,
      'firstName': profile.firstName,
      'lastName': profile.lastName,
      'phone': profile.phone || '',
      'linkedin': profile.linkedin || '',
      'github': profile.github || '',
      'website': profile.website || '',
      'location': profile.location || ''
    };

    return mapping[fieldType] || '';
  }

  private async typeIntoField(field: HTMLInputElement, value: string) {
    field.focus();
    field.value = value;

    // Trigger events to simulate real typing
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  private async waitForCondition(condition: WaitCondition): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < condition.timeout) {
      if (condition.type === 'element' && condition.selector) {
        const element = document.querySelector(condition.selector);
        if (element) return;
      } else if (condition.type === 'navigation') {
        // Wait for page load
        if (document.readyState === 'complete') return;
      }

      await this.sleep(100);
    }

    throw new Error(`Wait condition timeout: ${condition.type}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface AutofillResult {
  success: boolean;
  reason: string;
  stuckAt?: AutomationStep;
  action: string;
  error?: string;
}

interface WaitCondition {
  type: 'navigation' | 'element' | 'timeout';
  selector?: string;
  timeout: number;
}
```

---

## 6. Development Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up monorepo with Turborepo/Nx
- [ ] Initialize Next.js 14 web app
- [ ] Set up PostgreSQL + Prisma
- [ ] Implement authentication (NextAuth.js)
- [ ] Create basic UI components (shadcn/ui)
- [ ] Build user profile page
- [ ] Create Chrome extension scaffold

### Phase 2: Core Features (Weeks 5-8)
- [ ] Job tracker dashboard (Kanban view)
- [ ] Application CRUD operations
- [ ] Company management
- [ ] Document upload & storage
- [ ] Basic Chrome extension autofill
- [ ] Career page scraper

### Phase 3: Learning System (Weeks 9-12)
- [ ] Implement recorder module
- [ ] Build backend pattern analyzer
- [ ] Integrate Claude AI for analysis
- [ ] Create autofill engine
- [ ] Implement stuck detection
- [ ] Manual learning mode

### Phase 4: AI Features (Weeks 13-16)
- [ ] Resume builder with AI
- [ ] Cover letter generator
- [ ] Job matching algorithm
- [ ] Application status prediction
- [ ] Network referral suggestions

### Phase 5: Polish & Launch (Weeks 17-20)
- [ ] Analytics dashboard
- [ ] Billing integration (Stripe)
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Testing & bug fixes
- [ ] Deploy to production
- [ ] Marketing website
- [ ] Beta launch

---

## 7. Technology Stack Summary

**Frontend (Web)**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

**Frontend (Extension)**:
- Manifest V3
- TypeScript
- Vanilla JS/DOM API
- Chrome APIs

**Backend**:
- Node.js + Express
- PostgreSQL + Prisma
- Redis (caching)
- Bull (job queue)

**AI/ML**:
- Claude 3.5 Sonnet (Anthropic)
- OpenAI GPT-4 (alternative)
- Pinecone (vector DB for semantic search)

**Infrastructure**:
- Vercel (web app hosting)
- AWS S3 (file storage)
- AWS RDS (PostgreSQL)
- Cloudflare (CDN)
- Sentry (error tracking)
- PostHog (analytics)

**Dev Tools**:
- Turborepo (monorepo)
- pnpm (package manager)
- ESLint + Prettier
- Playwright (e2e testing)
- Jest (unit testing)

---

## 8. Key Success Factors

1. **Learning Accuracy**: The Playwright-style recording must generate reliable automation patterns (>80% success rate)

2. **Extension Performance**: Must not slow down browsing or consume excessive resources

3. **Privacy & Security**: User data (especially credentials) must be encrypted and never logged

4. **ATS Coverage**: Support for major ATS providers (Lever, Greenhouse, Workday, Ashby, etc.)

5. **User Experience**: Seamless flow between web app and extension with clear visual feedback

6. **Monetization Balance**: Free tier valuable enough to attract users, premium tier compelling enough to convert

---

This architecture provides a complete blueprint for building your intelligent job application platform. The unique "learning from manual completion" feature (Playwright-style recording) is the killer differentiator that will make automation work even for complex, custom application forms.

Next steps: Start with Phase 1 foundation work, beginning with the monorepo setup and basic authentication.
