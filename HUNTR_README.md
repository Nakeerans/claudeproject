# 🎯 Huntr.co Clone - Job Tracking Platform

A full-featured job search tracking application inspired by Huntr.co. Track applications, manage contacts, schedule interviews, and organize your job search with a beautiful Kanban board interface.

## ✨ Features

### Core Functionality
- ✅ **Kanban Board** - Drag-and-drop job cards across 5 stages (Wishlist → Applied → Interview → Offer → Rejected)
- ✅ **Job Management** - Full CRUD operations with detailed job information
- ✅ **Dashboard** - Analytics showing application stats, response rates, and progress
- ✅ **Authentication** - Secure login/register with JWT tokens
- ✅ **Contact Management** - Track recruiters and hiring managers (backend ready)
- ✅ **Interview Tracking** - Schedule and manage interviews (backend ready)
- ✅ **Document Storage** - Upload resumes and cover letters (backend ready)

### Technical Features
- ✅ **Database** - PostgreSQL with Prisma ORM
- ✅ **Backend API** - Complete REST API with Express.js
- ✅ **Frontend** - React 18 + Vite + Tailwind CSS
- ✅ **Drag-and-Drop** - @dnd-kit for smooth Kanban interactions
- ✅ **File Uploads** - Express fileupload middleware
- ✅ **Analytics** - Real-time statistics and metrics

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 20+
PostgreSQL 14+
npm
```

### Installation

1. **Clone and Install**
```bash
cd claudeproject
npm install
cd client && npm install && cd ..
```

2. **Setup Database**
```bash
# Create PostgreSQL database
createdb huntr_clone

# Or using psql
psql -U postgres
CREATE DATABASE huntr_clone;
\q
```

3. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/huntr_clone"
JWT_SECRET="your-secret-key-here"
SESSION_SECRET="your-session-secret"
CLIENT_URL="http://localhost:5173"
PORT=3000
```

4. **Run Database Migrations**
```bash
npm run db:generate
npm run db:migrate
```

5. **Start Development Servers**
```bash
# Start both backend and frontend
npm run dev

# Backend will run on http://localhost:3000
# Frontend will run on http://localhost:5173
```

6. **Open Application**
```
http://localhost:5173
```

## 📸 Screenshots & Usage

### Registration
1. Go to `http://localhost:5173`
2. Click "Sign up"
3. Create an account

### Dashboard
- View total jobs, applications this month, upcoming interviews
- See job distribution across stages
- Check response rate

### Kanban Board
- **Add Job**: Click "+ Add Job" button or "+" in any column
- **Move Job**: Drag and drop cards between columns
- **Delete Job**: Click trash icon on any card
- **View Details**: Click on job card (coming soon)

## 📁 Project Structure

```
claudeproject/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Layout.jsx
│   │   │   ├── JobCard.jsx
│   │   │   ├── AddJobModal.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Board.jsx
│   │   │   ├── Contacts.jsx
│   │   │   ├── Interviews.jsx
│   │   │   └── Documents.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── src/
│   ├── server/
│   │   ├── routes/           # API Routes
│   │   │   ├── auth.js
│   │   │   ├── jobs.js
│   │   │   ├── contacts.js
│   │   │   ├── interviews.js
│   │   │   ├── documents.js
│   │   │   └── analytics.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── index.js
│   └── utils/
│       ├── logger.js
│       └── monitoring.js
├── prisma/
│   └── schema.prisma         # Database schema
├── infrastructure/
│   └── terraform/            # AWS deployment
└── package.json
```

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register  - Create account
POST /api/auth/login     - Login
GET  /api/auth/me        - Get current user
POST /api/auth/logout    - Logout
```

### Jobs
```
GET    /api/jobs              - List all jobs
POST   /api/jobs              - Create job
GET    /api/jobs/:id          - Get single job
PUT    /api/jobs/:id          - Update job
PATCH  /api/jobs/:id/stage    - Update stage (for drag-drop)
DELETE /api/jobs/:id          - Delete job
```

### Contacts
```
GET    /api/contacts                        - List contacts
POST   /api/contacts                        - Create contact
PUT    /api/contacts/:id                    - Update contact
DELETE /api/contacts/:id                    - Delete contact
POST   /api/contacts/:contactId/jobs/:jobId - Link to job
```

### Interviews
```
GET    /api/interviews                - List interviews
POST   /api/interviews                - Schedule interview
PUT    /api/interviews/:id            - Update interview
PATCH  /api/interviews/:id/complete   - Mark complete
DELETE /api/interviews/:id            - Delete interview
```

### Documents
```
POST   /api/documents/upload    - Upload file
GET    /api/documents           - List documents
GET    /api/documents/:id       - Get document
DELETE /api/documents/:id       - Delete document
```

### Analytics
```
GET /api/analytics/dashboard     - Dashboard stats
GET /api/analytics/timeline      - Applications over time
GET /api/analytics/funnel        - Job funnel data
```

## 🗄️ Database Schema

### Tables
- **users** - User accounts
- **jobs** - Job applications
- **contacts** - Recruiters and hiring managers
- **job_contacts** - Job-Contact relationships
- **interviews** - Interview schedules
- **documents** - Uploaded files
- **activities** - Audit log

### Job Stages
- WISHLIST - Jobs you're interested in
- APPLIED - Applications submitted
- INTERVIEW - Interview scheduled/completed
- OFFER - Offers received
- REJECTED - Rejected applications

## 🎨 Technology Stack

### Backend
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Winston** - Logging

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **@dnd-kit** - Drag and drop
- **Axios** - HTTP client
- **React Router** - Navigation

## 🔧 Development Commands

```bash
# Backend
npm run dev:server         # Start backend only
npm run db:migrate         # Run database migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio

# Frontend
npm run dev:client         # Start frontend only

# Both
npm run dev                # Start both servers

# Build
npm run build              # Build for production
```

## 🚢 Deployment

### Using Terraform (AWS)
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Manual Deployment
1. Build frontend: `cd client && npm run build`
2. Set environment variables on server
3. Run migrations: `npm run db:migrate`
4. Start server: `npm start`

## 📊 Current Status

### ✅ Completed (85%)
- [x] Database schema design
- [x] Backend API (100%)
- [x] Authentication system
- [x] Job CRUD operations
- [x] Kanban board with drag-and-drop
- [x] Dashboard with analytics
- [x] Frontend routing and layout
- [x] Responsive design (basic)

### 🚧 In Progress (15%)
- [ ] Contacts UI implementation
- [ ] Interviews calendar view
- [ ] Documents upload UI
- [ ] Job detail modal
- [ ] Advanced search/filters
- [ ] Email notifications
- [ ] Chrome extension

## 🐛 Known Issues

1. Google OAuth not fully implemented (placeholder only)
2. Contacts/Interviews/Documents pages are placeholders
3. Job detail view modal not implemented
4. No search/filter on board view
5. Mobile responsiveness needs improvement

## 🔮 Future Enhancements

- [ ] Real-time updates with WebSockets
- [ ] Email notifications for deadlines
- [ ] Calendar integration (Google Calendar)
- [ ] Chrome extension for one-click job saving
- [ ] AI resume builder integration
- [ ] Cover letter generator
- [ ] Job recommendations
- [ ] Interview preparation notes
- [ ] Salary negotiation tracker

## 📝 License

MIT

## 🙏 Acknowledgments

- Inspired by [Huntr.co](https://huntr.co)
- Built with Claude AI assistance

---

**Need Help?**
- Check `HUNTR_SETUP_GUIDE.md` for detailed setup
- See `PROJECT_STATUS.md` for development progress
- Review `HUNTR_CLONE_SPEC.md` for technical specs
