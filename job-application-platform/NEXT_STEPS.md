# JobFlow - Next Steps

**Project Status**: Structure created, root dependencies installed ✅

---

## Current Status

✅ **Completed**:
- Project directory structure
- Root package.json with Turbo and build tools
- Workspace configuration (pnpm-workspace.yaml)
- All subdirectories (apps, packages, tools)

⚠️ **Pending**:
- Individual package setup (web app, API, extension)
- Dependencies for each package
- Database setup
- Environment configuration

---

## Immediate Next Steps

### 1. Set Up Next.js Web App

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install additional dependencies
npm install \
  @tanstack/react-query \
  @tanstack/react-query-devtools \
  zustand \
  next-auth \
  @auth/prisma-adapter \
  @prisma/client \
  lucide-react \
  date-fns \
  zod \
  react-hook-form \
  @hookform/resolvers

# Start dev server
npm run dev
# Visit: http://localhost:3000
```

### 2. Set Up Database Package (Prisma)

```bash
cd ../../packages/database

# Create package.json
cat > package.json << 'EOF'
{
  "name": "database",
  "version": "1.0.0",
  "main": "./index.ts",
  "scripts": {
    "dev": "echo 'Database package has no dev server'",
    "build": "prisma generate",
    "studio": "prisma studio"
  }
}
EOF

# Install Prisma
npm install @prisma/client
npm install -D prisma typescript @types/node

# Initialize Prisma
npx prisma init --datasource-provider postgresql

# Copy the complete schema from SYSTEM_ARCHITECTURE.md into:
# packages/database/prisma/schema.prisma

# Update .env with your PostgreSQL URL:
# DATABASE_URL="postgresql://user:password@localhost:5432/jobflow"

# Run migrations
npx prisma migrate dev --name init
```

### 3. Set Up API Server

```bash
cd ../../packages/api

# Create package.json
cat > package.json << 'EOF'
{
  "name": "api",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  }
}
EOF

# Install dependencies
npm install express cors dotenv @anthropic-ai/sdk bcryptjs jsonwebtoken
npm install -D @types/express @types/cors @types/bcryptjs @types/jsonwebtoken

# Create basic server
mkdir -p src
cat > src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
EOF

# Create .env
cat > .env << 'EOF'
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/jobflow
ANTHROPIC_API_KEY=your-key-here
JWT_SECRET=your-jwt-secret
EOF

# Start server
npm run dev
# Visit: http://localhost:3001/health
```

### 4. Set Up Chrome Extension

```bash
cd ../../apps/extension

# Create package.json
cat > package.json << 'EOF'
{
  "name": "extension",
  "version": "1.0.0",
  "description": "JobFlow Chrome Extension",
  "scripts": {
    "build": "echo 'Build step not needed for basic extension'"
  }
}
EOF

# Create manifest.json (see SYSTEM_ARCHITECTURE.md section 5.1 for complete version)
cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "JobFlow Assistant",
  "version": "1.0.0",
  "description": "Intelligent job application autofill",
  "permissions": ["storage", "activeTab"],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  "action": {
    "default_popup": "popup.html"
  }
}
EOF

# Create content.js (basic form detector)
cat > content.js << 'EOF'
console.log('JobFlow extension loaded');

// Detect job application forms
function detectForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input[type="email"], input[type="file"]');
    if (inputs.length >= 2) {
      console.log('Job application form detected!', form);
      addAutofillButton(form);
    }
  });
}

function addAutofillButton(form) {
  if (form.querySelector('.jobflow-autofill-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'jobflow-autofill-btn';
  btn.textContent = '⚡ JobFlow: Autofill';
  btn.style.cssText = `
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
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Autofill feature coming soon! Extension is working.');
  });

  document.body.appendChild(btn);
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectForms);
} else {
  detectForms();
}
EOF

# Create popup.html
cat > popup.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      width: 300px;
      padding: 20px;
      font-family: system-ui;
    }
  </style>
</head>
<body>
  <h2>JobFlow</h2>
  <p>Intelligent job application assistant</p>
  <p>✅ Extension active!</p>
</body>
</html>
EOF

# Load extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select this directory (apps/extension)
```

---

## Testing Your Setup

### Test Web App
```bash
cd apps/web
npm run dev
# Visit http://localhost:3000
```

### Test API
```bash
cd packages/api
npm run dev
# Visit http://localhost:3001/health
```

### Test Extension
1. Load in Chrome (see step 4 above)
2. Visit any job site (e.g., jobs.lever.co)
3. Look for the purple "⚡ JobFlow: Autofill" button

---

## Development Workflow

### Run All Services (After Setup)

```bash
# Terminal 1: Web app
cd apps/web && npm run dev

# Terminal 2: API server
cd packages/api && npm run dev

# Terminal 3: Database studio (optional)
cd packages/database && npx prisma studio
```

### Make Changes

**Web App**:
- Edit files in `apps/web/src/app/`
- Hot reload enabled

**API**:
- Edit files in `packages/api/src/`
- Server auto-restarts with --watch flag

**Extension**:
- Edit files in `apps/extension/`
- Reload extension in chrome://extensions/ after changes

---

## Where to Find Code Examples

All production-ready code is in the documentation:

1. **Database Schema**: `../jobflow-project/SYSTEM_ARCHITECTURE.md` section 3
   - Copy the complete Prisma schema

2. **API Endpoints**: `../jobflow-project/SYSTEM_ARCHITECTURE.md` section 4
   - All endpoint specifications

3. **Extension Code**: `../jobflow-project/SYSTEM_ARCHITECTURE.md` sections 5.2-5.5
   - background.js, content.js, recorder.js, autofill.js

4. **Learning System**: `../jobflow-project/SYSTEM_ARCHITECTURE.md` section 2.3
   - Complete TypeScript implementation

---

## Recommended Build Order

1. **Week 1-2**: Chrome Extension
   - Form detection
   - Basic autofill with hardcoded data
   - Test on real job sites

2. **Week 3-4**: Web App
   - Authentication (NextAuth)
   - Profile builder
   - Application tracker (basic CRUD)

3. **Week 5-6**: Recording System
   - Recorder module in extension
   - Store recordings in database
   - View recordings in web app

4. **Week 7-8**: AI Learning
   - Pattern analyzer
   - Claude API integration
   - Generate automation scripts

5. **Week 9-10**: Advanced Features
   - Career page scraper
   - Resume builder
   - Analytics

---

## Environment Variables Needed

Create these files:

**apps/web/.env.local**:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/jobflow
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXT_PUBLIC_API_URL=http://localhost:3001
ANTHROPIC_API_KEY=sk-ant-xxx
```

**packages/api/.env**:
```bash
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/jobflow
JWT_SECRET=generate-another-secret
ANTHROPIC_API_KEY=sk-ant-xxx
```

**packages/database/.env**:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/jobflow
```

---

## Troubleshooting

**Port already in use?**
```bash
# Find process
lsof -i :3000  # or :3001
# Kill process
kill -9 <PID>
```

**Database connection error?**
```bash
# Make sure PostgreSQL is running
pg_isready

# Check connection string format:
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Extension not loading?**
- Check manifest.json syntax
- Look for errors in chrome://extensions/
- Check browser console for content.js logs

**npm install fails?**
```bash
# Clear cache
npm cache clean --force
# Remove node_modules
rm -rf node_modules package-lock.json
# Reinstall
npm install
```

---

## Documentation Reference

| Need to... | See File |
|------------|----------|
| Understand architecture | `../jobflow-project/SYSTEM_ARCHITECTURE.md` |
| Get code examples | `../jobflow-project/SYSTEM_ARCHITECTURE.md` |
| See all features | `../jobflow-project/README.md` |
| Manual setup steps | `../jobflow-project/QUICK_START.md` |
| Current status | `../jobflow-project/FINAL_SUMMARY.md` |

---

## You're Ready to Build!

The foundation is complete. Start with the extension (the unique feature) and build incrementally.

**Next command to run**:
```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --src-dir
```

Good luck! 🚀
