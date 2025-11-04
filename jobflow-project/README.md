# JobFlow - Intelligent Job Application Platform

**AI-powered job application platform with a Chrome extension that learns from your manual interactions**

## Overview

JobFlow is a comprehensive job application management platform that combines:

1. **Web Application**: Full-featured SaaS dashboard for tracking job applications, managing your profile, storing documents, and analyzing your job search progress
2. **Chrome Extension**: Intelligent autofill that learns from how you manually fill out application forms (like Playwright's codegen)
3. **Learning System**: AI-powered pattern recognition that gets smarter with each application you complete
4. **Career Page Integration**: Automatically extract jobs from company career pages and apply with one click

## Key Features

### Unique Selling Point: Playwright-Style Learning

The extension watches you fill out job applications and learns:
- Which fields map to which profile data
- Navigation flows (multi-page applications)
- Button click sequences
- Timing and wait conditions
- Custom field transformations

When automation gets stuck, it switches to "learning mode" and records your manual completion to improve future automation.

### Core Features

**Application Tracking**
- Kanban/List/Timeline views
- Status workflow (Saved → Applied → Interviewing → Offer)
- Notes, contacts, and timeline for each application
- Favorites and priority system

**Smart Profile & Autofill**
- Comprehensive profile builder (personal info, education, experience, skills)
- Intelligent field mapping
- One-click autofill across any job site
- Resume and cover letter storage

**AI Features**
- Resume optimization
- Cover letter generation
- Job matching and recommendations
- Application success prediction

**Career Page Onboarding**
- Add company career page URL
- Auto-extract all job listings
- One-click apply with learned patterns

**Analytics**
- Application funnel analysis
- Response rate tracking
- Time-to-offer metrics
- Success predictions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├──────────────────────────┬──────────────────────────────────────┤
│   Web Application        │      Chrome Extension                │
│   (Next.js 14)           │      (Manifest V3)                   │
└──────────────────────────┴──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
│                      (Node.js + Express)                        │
└─────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │  AI Engine   │
│              │  │              │  │ (Claude AI)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Tech Stack

**Frontend (Web)**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Zustand

**Frontend (Extension)**
- Chrome Manifest V3
- TypeScript
- Vanilla DOM APIs

**Backend**
- Node.js + Express
- PostgreSQL + Prisma
- Redis (caching)
- Bull (job queue)

**AI/ML**
- Claude 3.5 Sonnet (Anthropic)
- Pattern analysis and automation

**Infrastructure**
- Vercel (web hosting)
- AWS S3 (file storage)
- AWS RDS (database)

## Project Structure

This repository contains documentation and initialization scripts:

```
jobflow-project/
├── README.md                      # This file
├── SYSTEM_ARCHITECTURE.md         # Complete technical architecture
├── PROJECT_SETUP_GUIDE.md         # Detailed setup instructions
├── init-project.sh                # Automated project setup script
└── docs/                          # Additional documentation
```

The actual application will be created when you run `./init-project.sh`, which creates:

```
job-application-platform/          # Created by init script
├── apps/
│   ├── web/                      # Next.js web app
│   └── extension/                # Chrome extension
├── packages/
│   ├── api/                      # Backend API
│   ├── database/                 # Prisma schema
│   ├── shared/                   # Shared types
│   └── ui/                       # Shared components
└── tools/
    └── learning-engine/          # AI pattern analyzer
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL 14+
- Git

### Installation

1. **Run the initialization script**:
   ```bash
   cd jobflow-project
   chmod +x init-project.sh
   ./init-project.sh
   ```

   This will:
   - Create the complete monorepo structure
   - Install all dependencies
   - Set up Next.js, Prisma, API, and Extension
   - Create environment file templates

2. **Navigate to the created project**:
   ```bash
   cd ../job-application-platform
   ```

3. **Configure environment variables**:
   ```bash
   # Copy environment templates
   cp apps/web/.env.example apps/web/.env.local
   cp packages/api/.env.example packages/api/.env

   # Edit with your credentials
   nano apps/web/.env.local
   nano packages/api/.env
   ```

   Required credentials:
   - PostgreSQL connection URL
   - Anthropic API key
   - NextAuth secret (generate with: `openssl rand -base64 32`)
   - JWT secret

4. **Set up database**:
   ```bash
   pnpm db:migrate
   ```

5. **Start development servers**:
   ```bash
   # Terminal 1: Web app
   pnpm dev:web

   # Terminal 2: API server
   pnpm dev:api

   # Terminal 3: Extension (watch mode)
   pnpm dev:extension
   ```

6. **Load Chrome extension**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `apps/extension/dist` folder

## Usage

### Web Application

1. Navigate to `http://localhost:3000`
2. Register an account
3. Complete your profile (personal info, education, experience)
4. Start tracking job applications

### Chrome Extension

**Method 1: Automatic Detection**
1. Visit any job application page
2. Look for the "JobFlow: Autofill this form" button
3. Click to autofill with your profile data

**Method 2: Add Career Page**
1. Go to web app → "Add Company"
2. Paste company career page URL (e.g., `https://jobs.lever.co/company`)
3. Click "Start Onboarding"
4. Extension extracts all job listings
5. Click job → Apply with autofill

**Learning Mode**
1. When autofill gets stuck, extension shows: "🔴 Recording - Complete manually"
2. Fill out the application form manually
3. Extension learns from your actions
4. Next time, it automates those exact steps

### Career Page Onboarding Flow

```
User: Adds career page URL in web app
   ↓
Extension: Scrapes job listings
   ↓
Web App: Shows preview of all jobs
   ↓
User: Clicks job to apply
   ↓
Extension: Opens application form
   ↓
┌──────────────────────────┬────────────────────────┐
│  Pattern Exists?         │  No Pattern?           │
│  ✅ Auto-fill form       │  🔴 Start recording    │
│  ⚡ Submit (optional)    │  👤 User fills manually│
│                          │  🧠 AI learns pattern  │
└──────────────────────────┴────────────────────────┘
   ↓
Web App: Saves application with status "Applied"
```

## Documentation

- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)**: Complete technical architecture with code examples
- **[PROJECT_SETUP_GUIDE.md](./PROJECT_SETUP_GUIDE.md)**: Detailed setup guide with troubleshooting
- **CONSOLIDATED_FEATURE_SET.md** (in simplify-ai-analyzer folder): Complete feature breakdown from analyzing Huntr and Simplify.jobs

## Development Workflow

### Create New Feature

```bash
git checkout -b feature/job-tracker-kanban

# Make changes in apps/web/src/app/(dashboard)/applications

pnpm dev:web  # Test locally

git commit -m "feat: add Kanban view for job tracker"
git push origin feature/job-tracker-kanban
```

### Database Changes

```bash
# Edit schema
vim packages/database/prisma/schema.prisma

# Create migration
pnpm db:migrate

# Restart dev servers
```

### Extension Development

```bash
# Make changes in apps/extension/src

# Rebuild
cd apps/extension
pnpm run build

# Reload extension in chrome://extensions/
```

### Test Learning System

```bash
# 1. Start recording on a career page
# 2. Manually fill out job application
# 3. Stop recording
# 4. Check database for recorded session:
pnpm db:studio

# 5. Trigger AI analysis:
curl -X POST http://localhost:3001/api/learning/sessions/{sessionId}/analyze

# 6. Test autofill on same site
```

## Deployment

### Web App (Vercel)

```bash
cd apps/web
vercel deploy --prod
```

Set environment variables in Vercel dashboard.

### API (Railway/Render/AWS)

```bash
# Example: Railway
railway init
railway add postgresql
railway up
```

### Extension (Chrome Web Store)

```bash
cd apps/extension
pnpm run build:prod

cd dist
zip -r ../jobflow-extension.zip *
```

Upload ZIP to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Roadmap

### Phase 1: Foundation (Weeks 1-4) ✅
- [x] System architecture design
- [x] Project initialization script
- [x] Documentation
- [ ] Monorepo setup
- [ ] Authentication
- [ ] Basic UI components

### Phase 2: Core Features (Weeks 5-8)
- [ ] Job tracker dashboard
- [ ] Application CRUD
- [ ] Company management
- [ ] Document upload
- [ ] Basic autofill

### Phase 3: Learning System (Weeks 9-12)
- [ ] Recorder module
- [ ] Pattern analyzer
- [ ] AI integration
- [ ] Stuck detection
- [ ] Manual learning mode

### Phase 4: AI Features (Weeks 13-16)
- [ ] Resume builder
- [ ] Cover letter generator
- [ ] Job matching
- [ ] Success prediction

### Phase 5: Polish & Launch (Weeks 17-20)
- [ ] Analytics dashboard
- [ ] Billing (Stripe)
- [ ] Email notifications
- [ ] Testing & QA
- [ ] Beta launch

## Monetization

**Free Tier**
- 50 applications
- 3 resume templates
- 100MB storage
- 50 autofills/month
- Basic analytics

**Premium Tier ($15-20/month)**
- Unlimited applications
- Unlimited autofills
- AI resume optimization
- AI cover letter generation
- Advanced analytics
- Priority support

**Enterprise Tier ($50-100+/month)**
- Team collaboration
- Shared application pipelines
- SSO integration
- Dedicated support
- Custom integrations

## Contributing

This is a personal project in development. Contributions, ideas, and feedback are welcome!

## Support & Issues

For questions or issues:
- Review the [System Architecture](./SYSTEM_ARCHITECTURE.md)
- Check the [Setup Guide](./PROJECT_SETUP_GUIDE.md)
- Open an issue with detailed description

## License

MIT License - See LICENSE file for details

---

## Why JobFlow?

**Problem**: Job searching is tedious. Filling out repetitive application forms wastes hours.

**Current Solutions**:
- Huntr: Great tracking, but manual form filling
- Simplify: Autofill works, but only for supported sites
- Manual copying: Slow, error-prone

**JobFlow's Innovation**:
- **Learns like Playwright**: Watches you once, automates forever
- **Works anywhere**: Not limited to known ATS providers
- **Gets smarter**: AI learns from every manual completion
- **Transparent**: Shows exactly what it learned and will do

**Target Users**:
- Active job seekers (applying to 10+ jobs/week)
- New grads (100+ applications needed)
- Career switchers
- Recruiters managing candidates

---

Built with ❤️ to make job searching less painful
