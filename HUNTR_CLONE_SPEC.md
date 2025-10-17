# Huntr.co Clone - Technical Specification

## Overview
Full-featured job search tracking platform replicating Huntr.co functionality

## Core Features to Implement

### 1. Job Tracking Board (Kanban)
**Columns/Stages:**
- Wishlist (interested in applying)
- Applied (application submitted)
- Interview (interview scheduled/completed)
- Offer (offer received)
- Rejected (not selected)

**Card Information:**
- Company name
- Job title
- Location
- Salary range
- Application date
- Status
- Priority/rating
- Notes
- Associated contacts
- Documents

### 2. Job Management
- Add job manually
- Save job from URL (Chrome extension)
- Edit job details
- Delete job
- Drag-and-drop between stages
- Archive old jobs
- Search and filter jobs
- Sort by date, company, status

### 3. Contact Tracking
- Add recruiters/hiring managers
- Contact information (email, phone, LinkedIn)
- Associated with specific jobs
- Notes and interaction history
- Reminders for follow-ups

### 4. Interview Tracker
- Schedule interviews
- Link to specific jobs
- Interview type (phone, video, in-person)
- Interviewer details
- Preparation notes
- Calendar integration
- Reminders

### 5. Document Management
- Upload resumes (multiple versions)
- Upload cover letters
- Other documents (portfolio, certificates)
- Associate documents with jobs
- Version control

### 6. Dashboard & Analytics
- Total applications count
- Applications by status (pie chart)
- Application timeline
- Response rate
- Average time to interview
- Jobs saved vs applied
- Map view of job locations

### 7. AI Features (Enhanced)
- AI resume builder integration
- Cover letter generator
- Job description analyzer
- Skills matcher

### 8. Chrome Extension
- One-click job saving from job boards
- Auto-fill application forms
- Extract job details
- Works on LinkedIn, Indeed, Glassdoor, etc.

## Technology Stack

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **Drag-and-Drop**: react-beautiful-dnd or dnd-kit
- **Charts**: recharts or chart.js
- **Maps**: Mapbox or Google Maps
- **State Management**: React Context + Zustand
- **Forms**: react-hook-form + zod

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js (Google OAuth, JWT)
- **File Storage**: AWS S3 or local storage
- **AI**: Claude API (already integrated)

### Infrastructure
- **Hosting**: AWS EC2 (already configured)
- **Database**: AWS RDS PostgreSQL
- **Storage**: AWS S3
- **CI/CD**: GitHub Actions (already configured)

## Database Schema

### Users
```sql
- id (uuid, primary key)
- email (unique)
- name
- google_id (for OAuth)
- avatar_url
- created_at
- updated_at
```

### Jobs
```sql
- id (uuid, primary key)
- user_id (foreign key)
- company_name
- job_title
- location
- job_url
- description
- salary_min
- salary_max
- stage (enum: wishlist, applied, interview, offer, rejected)
- priority (1-5)
- applied_date
- deadline
- notes
- created_at
- updated_at
```

### Contacts
```sql
- id (uuid, primary key)
- user_id (foreign key)
- name
- email
- phone
- linkedin_url
- company
- role
- notes
- created_at
```

### JobContacts (many-to-many)
```sql
- job_id
- contact_id
- relationship_type (recruiter, hiring_manager, referral)
```

### Interviews
```sql
- id (uuid, primary key)
- job_id (foreign key)
- interview_date
- interview_type (phone, video, in-person)
- location/link
- interviewer_name
- duration
- notes
- completed
- created_at
```

### Documents
```sql
- id (uuid, primary key)
- user_id (foreign key)
- job_id (nullable, foreign key)
- file_name
- file_type
- file_url
- document_type (resume, cover_letter, other)
- version
- created_at
```

## API Endpoints

### Authentication
- POST /api/auth/google
- POST /api/auth/logout
- GET /api/auth/me

### Jobs
- GET /api/jobs
- POST /api/jobs
- GET /api/jobs/:id
- PUT /api/jobs/:id
- DELETE /api/jobs/:id
- PATCH /api/jobs/:id/stage

### Contacts
- GET /api/contacts
- POST /api/contacts
- PUT /api/contacts/:id
- DELETE /api/contacts/:id

### Interviews
- GET /api/interviews
- POST /api/interviews
- PUT /api/interviews/:id
- DELETE /api/interviews/:id

### Documents
- POST /api/documents/upload
- GET /api/documents
- DELETE /api/documents/:id

### Analytics
- GET /api/analytics/dashboard
- GET /api/analytics/timeline

## UI Pages

1. **Landing Page** - Marketing site
2. **Login/Signup** - Authentication
3. **Dashboard** - Overview with stats
4. **Board View** - Kanban job tracker
5. **List View** - Table view of jobs
6. **Map View** - Geographic view
7. **Job Detail** - Single job page
8. **Contacts** - Contact management
9. **Interviews** - Interview calendar
10. **Documents** - File management
11. **Settings** - User preferences
12. **Analytics** - Detailed statistics

## Color Scheme (Huntr-inspired)
- Primary: #6a4feb (purple)
- Secondary: #4338ca (dark purple)
- Success: #10b981 (green)
- Warning: #f59e0b (orange)
- Error: #ef4444 (red)
- Background: #f9fafb (light gray)
- Text: #111827 (dark gray)

## Phase 1 Implementation (Current)
1. Database setup with Prisma
2. Backend API with authentication
3. Basic frontend with React
4. Kanban board with drag-and-drop
5. Job CRUD operations
6. User authentication (Google OAuth)

## Phase 2 (Future)
1. Advanced analytics
2. AI features integration
3. Chrome extension
4. Mobile responsive
5. Email notifications
6. Calendar integration
