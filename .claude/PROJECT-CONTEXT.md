# Huntr.co Clone Project - Complete Context for Claude Code Sessions

**Last Updated**: 2025-10-17
**Project Status**: AI-guided analyzer enhanced, ready for clone implementation
**Current Phase**: Analysis & Planning Complete, Ready for Implementation

---

## 🎯 Project Overview

### Primary Goal
Build a complete full-stack clone of Huntr.co - a job application tracking platform with AI-powered features, resume management, and Kanban-style job tracking.

### Tech Stack
**Backend:**
- Node.js + Express.js
- PostgreSQL with Prisma ORM
- JWT authentication
- AWS S3 (file storage)
- Passport.js (OAuth)

**Frontend:**
- React (Vite)
- TailwindCSS
- React Router
- Axios

**Testing:**
- Playwright (E2E)
- Jest (Unit)

**Infrastructure:**
- Terraform (AWS)
- Docker
- GitHub Actions (CI/CD)

**AI Integration:**
- Anthropic Claude API (resume analysis, job matching)
- Puppeteer (web scraping job postings)

---

## 📁 Project Structure

```
claudeproject/
├── src/
│   ├── server/              # Express backend
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   └── index.js         # Server entry
│   ├── browser-extension/   # Chrome extension for job tracking
│   └── scripts/             # Automation & analysis scripts
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── tests/
│   ├── e2e/                 # Playwright tests
│   └── unit/                # Jest tests
├── infrastructure/
│   └── terraform/           # AWS infrastructure as code
├── huntr-ai-guided-analysis/  # AI analyzer output
│   ├── html/                # HTML snapshots
│   ├── elements/            # Element data JSONs
│   ├── reports/             # Analysis reports
│   ├── elements-database.json  # Complete elements DB
│   ├── pages-database.json     # Complete pages DB
│   └── ENHANCEMENT-SUMMARY.md
└── scripts/
    └── ai-guided-huntr-analyzer.js  # Main analyzer
```

---

## 🔑 Critical Information

### 1. AI-Guided Analyzer (MOST RECENT WORK)

**Location**: `scripts/ai-guided-huntr-analyzer.js`

**Purpose**: Automated exploration of Huntr.co using Playwright + Claude AI to capture complete application structure for cloning.

**Key Features:**
- HTML-based analysis (not screenshot-based)
- Comprehensive DOM element extraction
- CSS selector and XPath generation
- Setup wizard automation ("Start from Scratch" option)
- Database generation for all pages and elements

**How It Works:**
1. Logs into Huntr.co with credentials
2. Navigates setup wizard (auto-selects "Start from Scratch")
3. Captures HTML + all DOM elements per page
4. Sends structured data to Claude AI for analysis
5. Claude AI decides next exploration actions
6. Executes actions and repeats for max 10 iterations
7. Saves comprehensive databases and reports

**Output Files:**
- `elements-database.json` - Every element on every page with selectors
- `pages-database.json` - Complete page structures
- `html/[timestamp]-[page].html` - Raw HTML snapshots
- `elements/[timestamp]-[page].json` - Element data per page
- `reports/AI-SUMMARY.md` - Human-readable summary
- `ai-decisions.json` - Claude's decision timeline

**Critical Setup Wizard Logic:**
After login, 3-page setup wizard:
1. **Page 1**: Job title + experience → Fill and continue
2. **Page 2**: Import options (upload/LinkedIn/**start from scratch**) → **MUST choose scratch**
3. **Page 3**: Continue setup

The analyzer has special detection for "Start from Scratch" options using multiple methods (radio, checkbox, button, toggle).

**Recent Enhancement** (Commit: 9ed19f1):
- Transitioned from screenshot to HTML analysis
- Added `click_selector` action type for precise targeting
- Comprehensive element tracking with states (visible, disabled, checked)
- Database saving at end of analysis
- Enhanced Claude AI prompt with HTML structure

---

### 2. Credentials & Environment

**Required Environment Variables:**
```bash
# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Huntr.co Credentials (for analyzer)
HUNTR_EMAIL=your-email@example.com
HUNTR_PASSWORD=your-password

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/huntr_clone

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=huntr-clone-uploads

# JWT
JWT_SECRET=your-secret-key-here
```

**Storage Locations:**
- Main `.env` file in project root
- Credentials stored in `.credentials` (gitignored)
- Never commit credentials to git

---

### 3. Database Schema Overview

**Key Models** (from `prisma/schema.prisma`):

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  resumes   Resume[]
  jobs      Job[]
  boards    Board[]
}

model Resume {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId])
  title        String
  content      Json     // Structured resume data
  fileUrl      String?  // S3 URL
  isBase       Boolean  @default(false)
  createdAt    DateTime @default(now())
  tailoredJobs Job[]
}

model Job {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId])
  boardId     String
  board       Board    @relation(fields: [boardId])
  title       String
  company     String
  location    String?
  salary      String?
  description String?
  status      String   // wishlist, applied, interview, offer, rejected
  url         String?
  createdAt   DateTime @default(now())
  resumeId    String?
  resume      Resume?  @relation(fields: [resumeId])
}

model Board {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId])
  name      String
  jobs      Job[]
  createdAt DateTime @default(now())
}
```

---

### 4. API Endpoints Structure

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

**Resumes:**
- `GET /api/resumes` - List user's resumes
- `POST /api/resumes` - Create resume (with file upload)
- `GET /api/resumes/:id` - Get single resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume
- `POST /api/resumes/:id/analyze` - AI analysis with Claude
- `POST /api/resumes/:id/tailor` - Tailor to job posting

**Jobs:**
- `GET /api/jobs` - List user's jobs
- `POST /api/jobs` - Create job entry
- `GET /api/jobs/:id` - Get single job
- `PUT /api/jobs/:id` - Update job (move columns)
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/scrape` - Scrape job posting data

**Boards:**
- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id` - Get board with jobs
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

---

### 5. Key Features to Implement

**Core Features** (from Huntr.co analysis):
1. ✅ User authentication (JWT + OAuth)
2. ⏳ Resume upload and management
3. ⏳ AI resume analysis (Claude API)
4. ⏳ Job-tailored resume generation
5. ⏳ Kanban board for job tracking (5 columns)
6. ⏳ Job scraping from URLs
7. ⏳ Cover letter generation
8. ⏳ Interview prep suggestions
9. ⏳ Browser extension for quick job adding
10. ⏳ Dashboard with metrics
11. ⏳ Email integration
12. ⏳ Calendar integration

**Setup Wizard Flow** (critical for UX):
1. Target job title + experience level
2. Import professional info (resume/LinkedIn/**scratch**)
3. Resume upload or creation
4. Initial job board setup
5. Tutorial/onboarding

---

### 6. Development Workflow

**Starting Development:**
```bash
# Install dependencies
npm install
cd client && npm install

# Setup database
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# Run dev servers (both backend + frontend)
npm run dev
```

**Running Analyzer:**
```bash
# Option 1: Using script
./scripts/run-ai-analysis.sh

# Option 2: Direct
export ANTHROPIC_API_KEY="..."
export HUNTR_EMAIL="..."
export HUNTR_PASSWORD="..."
node scripts/ai-guided-huntr-analyzer.js
```

**Testing:**
```bash
# E2E tests
npm run test:e2e

# Unit tests
npm test

# Run specific test
npx playwright test tests/e2e/auth.spec.ts
```

---

### 7. Git Workflow

**Branches:**
- `main` - Production-ready code
- Feature branches: `feature/resume-upload`, `feature/kanban-board`, etc.

**Commit Convention:**
```
type(scope): Brief description

Detailed explanation of changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Recent Commits:**
1. `9ed19f1` - Enhance AI-guided analyzer with HTML-based analysis
2. `96858fd` - Add first 5 API tests in Playwright
3. `861abe3` - Second initial commit: Hybrid multi-stack QA framework

---

### 8. Current State & Next Steps

**What's Complete:**
✅ Project structure and configuration
✅ Database schema designed
✅ AI-guided analyzer fully enhanced
✅ Comprehensive Huntr.co analysis completed
✅ Element and page databases generated
✅ Package.json with all dependencies
✅ Basic test framework setup

**What's Next (In Priority Order):**
1. **Implement Authentication** - JWT + Passport.js (backend + frontend)
2. **Build Resume Upload** - Multer + S3 integration
3. **Create Kanban Board UI** - React DnD + Tailwind
4. **Integrate Claude API** - Resume analysis endpoint
5. **Build Setup Wizard** - Multi-step form (mimic Huntr.co)
6. **Job Scraping Service** - Puppeteer integration
7. **Browser Extension** - Chrome extension for quick add
8. **Dashboard Metrics** - Charts and stats
9. **Email Integration** - Job application tracking
10. **Deployment** - Terraform + AWS setup

---

### 9. Common Issues & Solutions

**Issue**: Playwright tests fail with "Target closed"
**Solution**: Ensure browser context is not closed prematurely, add proper waits

**Issue**: Claude API rate limits
**Solution**: Implement exponential backoff, cache responses

**Issue**: S3 upload permissions
**Solution**: Check IAM role has s3:PutObject permission

**Issue**: Database migration conflicts
**Solution**: `npx prisma migrate reset` (dev only!)

**Issue**: Analyzer stuck on setup wizard
**Solution**: Check if "Start from Scratch" selector is correct, update in capturePageState()

---

### 10. Key Files to Reference

**For Backend Development:**
- `src/server/index.js` - Server entry and setup
- `prisma/schema.prisma` - Database models
- `src/server/middleware/auth.js` - JWT middleware

**For Frontend Development:**
- `client/src/App.jsx` - Main app component
- `client/src/pages/` - Page components
- `client/tailwind.config.js` - Styling config

**For Testing:**
- `tests/e2e/auth.spec.ts` - Authentication tests
- `playwright.config.ts` - Playwright configuration

**For Analysis Data:**
- `huntr-ai-guided-analysis/elements-database.json` - All UI elements
- `huntr-ai-guided-analysis/pages-database.json` - All page structures
- `huntr-ai-guided-analysis/reports/AI-SUMMARY.md` - Human-readable summary

---

### 11. Important Design Decisions

**Why Playwright over Selenium?**
- Modern, faster, better TypeScript support
- Built-in auto-wait and retry logic
- Better debugging tools

**Why Prisma over raw SQL?**
- Type-safe database queries
- Auto-generated types
- Easy migrations
- Works great with PostgreSQL

**Why Vite over Create React App?**
- Much faster HMR (Hot Module Replacement)
- Better build performance
- Modern ESM support

**Why Claude AI over OpenAI?**
- Better at structured output (JSON)
- Longer context window
- More accurate for resume analysis
- Anthropic's safety features

**Why HTML analysis over screenshots?**
- More accurate element detection
- Precise CSS selectors and XPath
- Better for automation
- Smaller storage footprint for databases
- Faster processing (no image encoding/decoding)

---

### 12. Code Patterns & Conventions

**API Routes Pattern:**
```javascript
// src/server/routes/resumes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getResumes, createResume } from '../controllers/resumeController.js';

const router = Router();

router.get('/', authenticate, getResumes);
router.post('/', authenticate, createResume);

export default router;
```

**Controller Pattern:**
```javascript
// src/server/controllers/resumeController.js
export const getResumes = async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.id }
    });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**React Component Pattern:**
```javascript
// client/src/components/ResumeCard.jsx
import { useState } from 'react';

export default function ResumeCard({ resume, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(resume.id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3>{resume.title}</h3>
      <button onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
```

---

### 13. Testing Patterns

**E2E Test Pattern:**
```typescript
// tests/e2e/resume.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Resume Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should upload resume', async ({ page }) => {
    await page.click('text=Upload Resume');
    await page.setInputFiles('input[type="file"]', 'test-resume.pdf');
    await page.click('button:has-text("Upload")');
    await expect(page.locator('text=Resume uploaded')).toBeVisible();
  });
});
```

---

### 14. Quick Commands Reference

```bash
# Development
npm run dev              # Start both backend + frontend
npm run dev:server       # Backend only
npm run dev:client       # Frontend only

# Database
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:seed          # Seed database

# Testing
npm test                 # Unit tests
npm run test:e2e         # E2E tests
npm run lint             # ESLint
npm run format           # Prettier

# Build
npm run build            # Build for production
npm start                # Start production server

# Analyzer
./scripts/run-ai-analysis.sh  # Run AI analyzer
```

---

## 🚀 How to Use This Context File in New Sessions

### Option 1: Quick Start Message
At the start of a new Claude Code session, send:

```
I'm continuing work on the Huntr.co clone project.
Please read .claude/PROJECT-CONTEXT.md for complete context.
Focus on [specific task/feature you want to work on].
```

### Option 2: Task-Specific Message
For specific features:

```
Continuing Huntr.co clone. Read .claude/PROJECT-CONTEXT.md.
I need help with: [specific feature]
Key files: [list relevant files from section 10]
```

### Option 3: Analysis Message
If analyzer data is needed:

```
Read .claude/PROJECT-CONTEXT.md for project context.
Also review huntr-ai-guided-analysis/elements-database.json
to understand Huntr.co's UI structure for implementing [feature].
```

---

## 📊 Token Savings Strategy

**Without Context File:**
- Claude reads ~15-20 files to understand project
- Analyzes git history
- Reads package.json, schema.prisma, etc.
- **Estimated**: ~50,000-80,000 tokens

**With Context File:**
- Claude reads just this file (~8,000 tokens)
- Direct access to all key information
- No redundant analysis
- **Estimated**: ~10,000-15,000 tokens

**Savings**: ~70-85% token reduction per session start

---

## 🔄 Updating This File

**When to Update:**
- After implementing major features
- After architectural decisions
- After analyzer runs (update analysis stats)
- Weekly during active development

**What to Update:**
- Current state & next steps (Section 8)
- Recent commits (Section 7)
- New dependencies (Section 11)
- New issues encountered (Section 9)

**How to Update:**
```bash
# Edit the file
nano .claude/PROJECT-CONTEXT.md

# Commit changes
git add .claude/PROJECT-CONTEXT.md
git commit -m "Update project context with [what changed]"
```

---

## 📝 Notes for Future Claude Sessions

1. **Always check this file first** before asking about project structure
2. **Refer to section numbers** when asking questions (e.g., "See section 5 for features")
3. **Update after significant work** to keep context fresh
4. **Use analyzer databases** for UI implementation details
5. **Check git log** for recent changes not yet in this file

---

**END OF CONTEXT FILE**

*This file is designed to give Claude Code complete understanding of the project in a single read, minimizing token usage and analysis time in future sessions.*
