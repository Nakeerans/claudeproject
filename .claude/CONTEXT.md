# Project Context - Huntr.co Clone (Self-Contained)

**Last Updated**: 2025-10-17
**Status**: Analysis complete, ready for implementation
**Read this file at session start to get full context with minimal tokens**

---

## Quick Start for New Sessions

**Just say this:**
```
Read .claude/CONTEXT.md and continue working on [your specific task]
```

---

## 1. PROJECT OVERVIEW

**Goal**: Full-stack Huntr.co clone - AI-powered job application tracking platform

**Stack**:
- Backend: Node.js + Express + PostgreSQL + Prisma
- Frontend: React (Vite) + TailwindCSS
- AI: Anthropic Claude API
- Testing: Playwright + Jest
- Infra: AWS (S3, EC2, RDS) + Terraform

**Current Phase**: Post-analysis, ready for feature implementation

---

## 2. COMPLETE DATABASE SCHEMA

```prisma
// THIS IS THE ACTUAL SCHEMA - No need to read schema.prisma

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  name          String
  googleId      String?     @unique
  avatarUrl     String?
  password      String?     // bcrypt hashed
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  jobs          Job[]
  contacts      Contact[]
  documents     Document[]
}

enum JobStage {
  WISHLIST      // Initial interest
  APPLIED       // Application submitted
  INTERVIEW     // Interview scheduled/in progress
  OFFER         // Offer received
  REJECTED      // Rejected or withdrawn
  ARCHIVED      // Old/inactive
}

model Job {
  id            String      @id @default(uuid())
  userId        String
  companyName   String
  jobTitle      String
  location      String?
  jobUrl        String?
  description   String?     @db.Text
  salaryMin     Int?
  salaryMax     Int?
  stage         JobStage    @default(WISHLIST)
  priority      Int?        @default(3)  // 1-5
  appliedDate   DateTime?
  deadline      DateTime?
  notes         String?     @db.Text
  color         String?     @default("#6a4feb")
  position      Int         @default(0)  // For drag-drop ordering
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  contacts      JobContact[]
  interviews    Interview[]
  documents     Document[]
  activities    Activity[]
}

model Contact {
  id            String      @id @default(uuid())
  userId        String
  name          String
  email         String?
  phone         String?
  linkedinUrl   String?
  company       String?
  role          String?
  notes         String?     @db.Text
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobs          JobContact[]
}

enum ContactRelationshipType {
  RECRUITER
  HIRING_MANAGER
  REFERRAL
  EMPLOYEE
  OTHER
}

model JobContact {
  jobId             String
  contactId         String
  relationshipType  ContactRelationshipType
  notes             String?
  createdAt         DateTime    @default(now())

  job               Job         @relation(fields: [jobId], references: [id], onDelete: Cascade)
  contact           Contact     @relation(fields: [contactId], references: [id], onDelete: Cascade)
  @@id([jobId, contactId])
}

enum InterviewType {
  PHONE
  VIDEO
  IN_PERSON
  TECHNICAL
  BEHAVIORAL
  PANEL
  OTHER
}

model Interview {
  id                String          @id @default(uuid())
  jobId             String
  interviewDate     DateTime
  interviewType     InterviewType
  locationOrLink    String?
  interviewerName   String?
  interviewerEmail  String?
  duration          Int?            // minutes
  notes             String?         @db.Text
  preparationNotes  String?         @db.Text
  completed         Boolean         @default(false)
  rating            Int?            // 1-5
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  job               Job             @relation(fields: [jobId], references: [id], onDelete: Cascade)
}

enum DocumentType {
  RESUME
  COVER_LETTER
  PORTFOLIO
  CERTIFICATE
  OTHER
}

model Document {
  id            String        @id @default(uuid())
  userId        String
  jobId         String?       // Nullable for general docs
  fileName      String
  fileType      String        // mime type
  fileUrl       String        // S3 URL
  fileSize      Int           // bytes
  documentType  DocumentType
  version       Int           @default(1)
  notes         String?
  createdAt     DateTime      @default(now())

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  job           Job?          @relation(fields: [jobId], references: [id], onDelete: SetNull)
}

enum ActivityType {
  JOB_CREATED
  JOB_UPDATED
  STAGE_CHANGED
  APPLICATION_SUBMITTED
  INTERVIEW_SCHEDULED
  INTERVIEW_COMPLETED
  OFFER_RECEIVED
  OFFER_ACCEPTED
  OFFER_REJECTED
  NOTE_ADDED
  CONTACT_ADDED
  DOCUMENT_UPLOADED
}

model Activity {
  id            String        @id @default(uuid())
  jobId         String
  activityType  ActivityType
  description   String
  metadata      Json?         // Flexible data
  createdAt     DateTime      @default(now())

  job           Job           @relation(fields: [jobId], references: [id], onDelete: Cascade)
}
```

**Key Relationships**:
- User → Jobs (one-to-many)
- Job → Contacts (many-to-many via JobContact)
- Job → Interviews (one-to-many)
- Job → Documents (one-to-many)
- Job → Activities (one-to-many, for timeline)

---

## 3. API STRUCTURE (Complete List)

**Auth** (`/api/auth`):
```javascript
POST /register        // { email, password, name }
POST /login           // { email, password } → JWT token
POST /google          // Google OAuth
GET  /me              // Get current user (requires JWT)
```

**Jobs** (`/api/jobs`):
```javascript
GET    /              // List all user's jobs
POST   /              // Create job { companyName, jobTitle, stage, ... }
GET    /:id           // Get single job with relations
PUT    /:id           // Update job (move stage, edit details)
DELETE /:id           // Delete job
PATCH  /:id/stage     // Move to different stage { stage, position }
POST   /scrape        // Scrape job from URL { url } → job data
```

**Contacts** (`/api/contacts`):
```javascript
GET    /              // List all contacts
POST   /              // Create contact { name, email, company, ... }
GET    /:id           // Get single contact
PUT    /:id           // Update contact
DELETE /:id           // Delete contact
POST   /:id/jobs      // Link contact to job { jobId, relationshipType }
```

**Interviews** (`/api/interviews`):
```javascript
GET    /              // List all interviews
POST   /              // Create interview { jobId, interviewDate, type, ... }
GET    /:id           // Get single interview
PUT    /:id           // Update interview
DELETE /:id           // Delete interview
PATCH  /:id/complete  // Mark as completed { rating, notes }
```

**Documents** (`/api/documents`):
```javascript
GET    /              // List all documents
POST   /upload        // Upload file (multipart/form-data) → S3 URL
GET    /:id           // Get single document
DELETE /:id           // Delete document + S3 file
POST   /analyze       // AI resume analysis { documentId } → suggestions
POST   /tailor        // Generate tailored resume { documentId, jobId }
```

**Activities** (`/api/activities`):
```javascript
GET    /              // Get activity timeline
GET    /job/:jobId    // Get activities for specific job
```

---

## 4. ENVIRONMENT VARIABLES (Required)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/huntr_clone"

# JWT Auth
JWT_SECRET="your-super-secret-key-min-32-chars"

# Anthropic Claude AI
ANTHROPIC_API_KEY="sk-ant-api03-..."

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="huntr-clone-uploads"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Analyzer credentials (for development)
HUNTR_EMAIL="your-test-account@email.com"
HUNTR_PASSWORD="your-password"

# App Config
PORT=3000
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

---

## 5. KEY FEATURES & IMPLEMENTATION STATUS

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| JWT Authentication | ⏳ Todo | P0 | Backend ready, need frontend |
| Google OAuth | ⏳ Todo | P1 | Optional for MVP |
| Kanban Job Board | ⏳ Todo | P0 | 6 stages, drag-drop |
| Job CRUD | ⏳ Todo | P0 | Basic operations |
| Job URL Scraping | ⏳ Todo | P1 | Puppeteer integration |
| Resume Upload (S3) | ⏳ Todo | P0 | Multer + AWS SDK |
| Resume AI Analysis | ⏳ Todo | P1 | Claude API |
| Tailored Resume Gen | ⏳ Todo | P2 | AI-powered |
| Contacts Management | ⏳ Todo | P2 | Link to jobs |
| Interview Tracking | ⏳ Todo | P2 | Calendar integration |
| Activity Timeline | ⏳ Todo | P2 | Auto-generated |
| Dashboard Stats | ⏳ Todo | P1 | Charts, metrics |
| Email Integration | ⏳ Todo | P3 | Gmail API |
| Browser Extension | ⏳ Todo | P3 | Chrome ext |
| Setup Wizard | ⏳ Todo | P1 | 3-page onboarding |

**MVP = P0 + P1 features**

---

## 6. SETUP WIZARD FLOW (Critical UX)

```
Page 1: Welcome & Target Job
├─ Input: Job title (autocomplete)
├─ Input: Experience level (dropdown: Entry/Mid/Senior/Lead)
└─ Button: Continue

Page 2: Import Professional Info
├─ Option 1: Upload resume file
├─ Option 2: LinkedIn profile URL
├─ Option 3: Start from Scratch ← DEFAULT/RECOMMENDED
└─ Button: Continue

Page 3: Create First Board
├─ Input: Board name (default: "Job Search 2025")
├─ Preview: Kanban columns (Wishlist/Applied/Interview/Offer/Rejected)
└─ Button: Get Started

Page 4: Dashboard
├─ Empty state with tutorial
├─ "+ Add Job" button
└─ Sample data option
```

**Implementation Notes**:
- Multi-step form component
- Save progress to localStorage
- Skip option for returning users
- Track completion in User model

---

## 7. CODE PATTERNS (Use These)

**Backend Controller Pattern**:
```javascript
// src/server/controllers/jobController.js
import { prisma } from '../db.js';

export const getJobs = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { userId: req.user.id },
      include: {
        interviews: true,
        documents: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 5 }
      },
      orderBy: [
        { stage: 'asc' },
        { position: 'asc' }
      ]
    });
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const createJob = async (req, res) => {
  try {
    const { companyName, jobTitle, stage, ...rest } = req.body;

    // Validation
    if (!companyName || !jobTitle) {
      return res.status(400).json({ error: 'Company and title required' });
    }

    // Get max position for stage
    const maxPos = await prisma.job.aggregate({
      where: { userId: req.user.id, stage },
      _max: { position: true }
    });

    const job = await prisma.job.create({
      data: {
        userId: req.user.id,
        companyName,
        jobTitle,
        stage,
        position: (maxPos._max.position || 0) + 1,
        ...rest
      },
      include: {
        activities: true
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};
```

**Frontend API Hook Pattern**:
```javascript
// client/src/hooks/useJobs.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/jobs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setJobs(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData) => {
    const res = await axios.post('/api/jobs', jobData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setJobs([...jobs, res.data]);
    return res.data;
  };

  const updateJob = async (id, updates) => {
    const res = await axios.put(`/api/jobs/${id}`, updates, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setJobs(jobs.map(j => j.id === id ? res.data : j));
    return res.data;
  };

  const deleteJob = async (id) => {
    await axios.delete(`/api/jobs/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setJobs(jobs.filter(j => j.id !== id));
  };

  return { jobs, loading, error, createJob, updateJob, deleteJob, refetch: fetchJobs };
}
```

---

## 8. AI ANALYZER RESULTS (Summary)

**Completed**: 2025-10-17, 10 iterations, 70% coverage

**Key Findings from Huntr.co**:
- 6-column Kanban board (Wishlist → Rejected/Archived)
- Drag-and-drop job cards with priority colors
- Setup wizard: 3 pages, "Start from Scratch" is recommended path
- Resume upload: PDF/DOCX, drag-drop UI
- Job card fields: Company, Title, Location, Salary range, Status, Priority, Notes
- Quick add: Browser extension + URL scraper
- Contacts: Linked to jobs with relationship types
- Interviews: Calendar view + preparation notes
- Activity timeline: Auto-generated from all actions
- Dashboard metrics: Applications sent, Response rate, Interview ratio

**Databases Generated**:
- `huntr-ai-guided-analysis/elements-database.json` - All UI elements with selectors
- `huntr-ai-guided-analysis/pages-database.json` - Complete page structures
- Use these for exact UI recreation

---

## 9. CURRENT STATE & NEXT STEPS

**Completed** ✅:
- Project structure
- Database schema
- AI analyzer (HTML-based, comprehensive)
- Complete Huntr.co analysis
- Package dependencies
- Testing framework setup

**Next (Priority Order)**:
1. **Auth Backend** - JWT middleware, register/login endpoints
2. **Auth Frontend** - Login/register pages, token storage
3. **Jobs CRUD Backend** - All job endpoints
4. **Kanban Board UI** - React DnD, 6 columns, drag-drop
5. **Job Card Component** - Match Huntr.co design
6. **Setup Wizard** - 3-page onboarding flow
7. **Resume Upload** - S3 integration
8. **Dashboard** - Stats and metrics

**Current Work**: None in progress (ready for you to start!)

---

## 10. COMMON COMMANDS

```bash
# Development
npm run dev                    # Both backend + frontend
npm run dev:server             # Backend only (port 3000)
npm run dev:client             # Frontend only (port 5173)

# Database
npx prisma migrate dev         # Create migration
npx prisma generate            # Update Prisma client
npx prisma studio              # DB GUI
npx prisma db seed             # Seed data

# Testing
npm run test:e2e               # Playwright tests
npm test                       # Jest unit tests

# Analyzer
./scripts/run-ai-analysis.sh   # Run Huntr analyzer
```

---

## 11. CRITICAL DECISIONS & RATIONALE

**Why PostgreSQL?**
- Complex relations (jobs, contacts, interviews)
- JSON support for metadata
- Better for production than SQLite

**Why Prisma?**
- Type-safe queries
- Auto-generated types
- Easy migrations
- Great developer experience

**Why Vite over CRA?**
- 10x faster HMR
- Better build times
- Native ESM

**Why Claude AI?**
- 200k context window (entire resumes)
- Better structured output (JSON)
- More accurate than GPT-3.5
- Anthropic safety features

**Why HTML Analysis?**
- More accurate than screenshots
- Precise CSS selectors
- Better for automation
- Complete element states

**Why Kanban over List?**
- Visual pipeline
- Drag-drop UX
- Clear stage progression
- Industry standard for job tracking

---

## 12. RECENT WORK (Last Commit)

**Commit**: `9ed19f1` (2025-10-17)
**Title**: Enhance AI-guided analyzer: HTML-based analysis

**Changes**:
- Replaced screenshot with HTML analysis
- Added comprehensive element extraction
- CSS selector + XPath generation
- Setup wizard "Start from Scratch" detection
- Database generation (elements + pages)
- New `click_selector` action type

**Files**:
- `scripts/ai-guided-huntr-analyzer.js` - Complete rewrite
- `.gitignore` - Track reports, exclude large files
- `huntr-ai-guided-analysis/ENHANCEMENT-SUMMARY.md` - Full docs

---

## 13. PROJECT FILES LOCATION

```
claudeproject/
├── src/server/          # Backend (not yet implemented)
├── client/              # Frontend (not yet implemented)
├── prisma/
│   └── schema.prisma    # Schema above (actual file)
├── scripts/
│   └── ai-guided-huntr-analyzer.js  # Analyzer
├── huntr-ai-guided-analysis/
│   ├── elements-database.json       # UI elements data
│   ├── pages-database.json          # Page structures
│   └── reports/AI-SUMMARY.md        # Human summary
├── .claude/
│   └── CONTEXT.md       # THIS FILE
├── package.json
└── .env                 # Environment vars
```

---

## HOW TO USE THIS FILE

### Starting a New Session:
```
Read .claude/CONTEXT.md and help me implement [feature name]
```

### For Specific Tasks:
```
Read .claude/CONTEXT.md.
I need to build the Kanban board UI (Section 5, P0 priority).
Use the schema in Section 2 and patterns in Section 7.
```

### For UI Work:
```
Read .claude/CONTEXT.md.
Also check huntr-ai-guided-analysis/elements-database.json
for Huntr.co's [specific component] implementation.
I'm building [your component].
```

---

## TOKEN SAVINGS

**Without this file**: ~60,000 tokens (reading 20+ files)
**With this file**: ~15,000 tokens (just this file)
**Savings**: 75% reduction

---

**END OF CONTEXT**

*This file contains ALL essential information. Claude doesn't need to read other files to understand the project.*
