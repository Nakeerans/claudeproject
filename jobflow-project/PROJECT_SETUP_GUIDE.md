# JobFlow - Project Setup Guide

## Quick Start

This guide will help you set up the complete JobFlow platform from scratch.

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ and pnpm installed
- **PostgreSQL** 14+ running locally or in cloud
- **Redis** (optional for MVP, required for production)
- **Anthropic API Key** for Claude AI
- **AWS S3** account for file uploads (or use local storage for dev)
- **Chrome Browser** for extension development

---

## Project Structure

```
job-application-platform/
├── apps/
│   ├── web/                  # Next.js web application
│   └── extension/            # Chrome extension
├── packages/
│   ├── api/                  # Backend API (Express)
│   ├── database/             # Prisma schema & migrations
│   ├── shared/               # Shared TypeScript types
│   └── ui/                   # Shared React components
├── tools/
│   └── learning-engine/      # AI learning system
├── docs/                     # Documentation
├── .github/                  # CI/CD workflows
├── turbo.json               # Turborepo config
├── package.json             # Root package.json
└── pnpm-workspace.yaml      # pnpm workspace config
```

---

## Step-by-Step Setup

### Step 1: Initialize Monorepo

```bash
# Create project directory
mkdir job-application-platform
cd job-application-platform

# Initialize pnpm workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
EOF

# Initialize root package.json
pnpm init

# Install Turborepo
pnpm add turbo -D -w

# Create turbo.json
cat > turbo.json << EOF
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
EOF

# Create directory structure
mkdir -p apps/web apps/extension
mkdir -p packages/api packages/database packages/shared packages/ui
mkdir -p tools/learning-engine
mkdir -p docs
```

### Step 2: Set Up Next.js Web App

```bash
cd apps/web

# Create Next.js app with TypeScript and Tailwind
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install additional dependencies
pnpm add \
  @tanstack/react-query \
  @tanstack/react-query-devtools \
  zustand \
  next-auth \
  @auth/prisma-adapter \
  @prisma/client \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-toast \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  date-fns \
  zod \
  react-hook-form \
  @hookform/resolvers

# Install dev dependencies
pnpm add -D \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript \
  prettier \
  prettier-plugin-tailwindcss \
  eslint \
  eslint-config-next

# Initialize shadcn/ui
pnpm dlx shadcn-ui@latest init
```

Create `apps/web/src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobFlow - Intelligent Job Application Platform',
  description: 'AI-powered job application tracking and automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Create `apps/web/src/components/providers.tsx`:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

### Step 3: Set Up Database (Prisma)

```bash
cd ../../packages/database

# Initialize package.json
pnpm init

# Install Prisma
pnpm add @prisma/client
pnpm add -D prisma

# Initialize Prisma
pnpm prisma init --datasource-provider postgresql

# Update .env with your database URL
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/jobflow?schema=public"
EOF
```

Copy the Prisma schema from `SYSTEM_ARCHITECTURE.md` to `packages/database/prisma/schema.prisma`

```bash
# Generate Prisma Client
pnpm prisma generate

# Create and run migrations
pnpm prisma migrate dev --name init

# Seed database (optional)
pnpm prisma db seed
```

### Step 4: Set Up Backend API

```bash
cd ../../packages/api

# Initialize package.json
pnpm init

# Install dependencies
pnpm add \
  express \
  @anthropic-ai/sdk \
  cors \
  helmet \
  express-rate-limit \
  bcryptjs \
  jsonwebtoken \
  dotenv \
  zod

pnpm add -D \
  @types/express \
  @types/cors \
  @types/bcryptjs \
  @types/jsonwebtoken \
  typescript \
  tsx \
  nodemon
```

Create `packages/api/src/index.ts`:
```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Import routers
import authRouter from './routes/auth'
import profileRouter from './routes/profile'
import applicationsRouter from './routes/applications'
import learningRouter from './routes/learning'

app.use('/api/auth', authRouter)
app.use('/api/profile', profileRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/learning', learningRouter)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
```

### Step 5: Set Up Chrome Extension

```bash
cd ../../apps/extension

# Initialize package.json
pnpm init

# Install dependencies
pnpm add webextension-polyfill

pnpm add -D \
  typescript \
  @types/chrome \
  @types/webextension-polyfill \
  webpack \
  webpack-cli \
  ts-loader \
  copy-webpack-plugin
```

Create `apps/extension/manifest.json`:
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
      "resources": ["recorder.js", "autofill.js", "icons/*"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

Create `apps/extension/webpack.config.js`:
```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts',
    options: './src/options.ts',
    recorder: './src/recorder.ts',
    autofill: './src/autofill.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'options.html', to: 'options.html' },
        { from: 'icons', to: 'icons' },
        { from: 'styles', to: 'styles' }
      ]
    })
  ]
};
```

### Step 6: Set Up Learning Engine

```bash
cd ../../tools/learning-engine

pnpm init

pnpm add \
  @anthropic-ai/sdk \
  @prisma/client \
  cheerio \
  dotenv

pnpm add -D typescript @types/node tsx
```

Create `tools/learning-engine/src/analyzer.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const prisma = new PrismaClient()

export class PatternAnalyzer {
  async analyzeSession(sessionId: string) {
    const session = await prisma.recordedSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    })

    if (!session) throw new Error('Session not found')

    // Analyze with Claude
    const pattern = await this.analyzeWithAI(session)

    // Save pattern
    return await prisma.applicationPattern.create({
      data: {
        companyId: session.companyId,
        companyDomain: session.companyDomain,
        formStructure: pattern.formStructure,
        fieldMappings: pattern.fieldMappings,
        navigationFlow: pattern.navigationFlow,
        automationScript: pattern.automationScript,
        confidence: pattern.confidence
      }
    })
  }

  private async analyzeWithAI(session: any) {
    const prompt = `
Analyze this recorded job application session and extract automation patterns.

Session Data:
${JSON.stringify(session, null, 2)}

Return JSON with:
1. formStructure: { type: 'single-page' | 'multi-page', pageCount, pages }
2. fieldMappings: [{ formFieldSelector, profileField, confidence }]
3. navigationFlow: [{ order, action, selector, waitCondition }]
4. automationScript: { steps, fallbackStrategy }
5. confidence: 0-1 score
    `

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })

    return JSON.parse(message.content[0].text)
  }
}
```

### Step 7: Environment Variables

Create `.env.local` files in each app:

**apps/web/.env.local**:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jobflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Anthropic
ANTHROPIC_API_KEY="your-anthropic-key"

# AWS S3 (optional for dev)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_BUCKET_NAME="jobflow-uploads"
AWS_REGION="us-east-1"
```

**packages/api/.env**:
```bash
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/jobflow"
JWT_SECRET="your-jwt-secret"
ANTHROPIC_API_KEY="your-anthropic-key"
REDIS_URL="redis://localhost:6379"
```

**apps/extension/.env**:
```bash
API_BASE_URL="http://localhost:3001"
```

### Step 8: Update Root package.json Scripts

```json
{
  "name": "job-application-platform",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:api": "turbo run dev --filter=api",
    "dev:extension": "turbo run dev --filter=extension",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:api": "turbo run build --filter=api",
    "build:extension": "turbo run build --filter=extension",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "cd packages/database && pnpm prisma migrate dev",
    "db:studio": "cd packages/database && pnpm prisma studio",
    "db:seed": "cd packages/database && pnpm prisma db seed"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@8.0.0"
}
```

### Step 9: Run Development Servers

```bash
# Terminal 1: Run web app
pnpm dev:web

# Terminal 2: Run API server
pnpm dev:api

# Terminal 3: Build extension (watch mode)
cd apps/extension
pnpm run watch

# Terminal 4: Database studio (optional)
pnpm db:studio
```

### Step 10: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `apps/extension/dist` folder
5. Extension should now appear in your extensions list

---

## Development Workflow

### 1. Create New Feature

```bash
# Create feature branch
git checkout -b feature/job-tracker-kanban

# Make changes in apps/web/src/app/(dashboard)/applications

# Test locally
pnpm dev:web

# Commit
git add .
git commit -m "feat: add Kanban view for job tracker"
git push origin feature/job-tracker-kanban
```

### 2. Database Changes

```bash
# Edit schema
vim packages/database/prisma/schema.prisma

# Create migration
cd packages/database
pnpm prisma migrate dev --name add_user_preferences

# Generate client
pnpm prisma generate

# Restart dev servers
```

### 3. Extension Development

```bash
# Make changes in apps/extension/src

# Rebuild
cd apps/extension
pnpm run build

# Reload extension in chrome://extensions/
# (Click reload icon on extension card)

# Test on a job application page
```

### 4. Test Learning System

```bash
# Start recording on a career page
# Manually fill out job application
# Stop recording

# Check database for recorded session
pnpm db:studio

# Trigger AI analysis
curl -X POST http://localhost:3001/api/learning/sessions/{sessionId}/analyze

# Check generated pattern
# Test autofill on same site
```

---

## Testing

### Unit Tests (Jest)

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm test --filter=web
pnpm test --filter=api
```

### E2E Tests (Playwright)

```bash
# Install Playwright
pnpm add -D @playwright/test -w

# Run E2E tests
pnpm exec playwright test

# Open UI mode
pnpm exec playwright test --ui
```

### Extension Testing

1. Manual testing on various job sites:
   - Lever (e.g., jobs.lever.co/*)
   - Greenhouse (e.g., boards.greenhouse.io/*)
   - Workday (e.g., *.myworkdayjobs.com/*)

2. Automated testing with Playwright:
   ```typescript
   // tests/extension.spec.ts
   test('autofill works on Lever', async ({ page, context }) => {
     // Load extension
     const extensionPath = path.join(__dirname, '../apps/extension/dist')
     await context.addExtension(extensionPath)

     // Navigate to job application
     await page.goto('https://jobs.lever.co/example/apply')

     // Trigger autofill
     await page.click('#jobflow-autofill-btn')

     // Verify fields filled
     await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com')
   })
   ```

---

## Deployment

### Web App (Vercel)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/web
vercel deploy --prod

# Set environment variables in Vercel dashboard
```

### API (AWS/Railway/Render)

```bash
# Example: Deploy to Railway
railway init
railway add postgresql
railway up

# Or Docker deployment
docker build -t jobflow-api .
docker push your-registry/jobflow-api
```

### Extension (Chrome Web Store)

1. Build production version:
   ```bash
   cd apps/extension
   pnpm run build:prod
   ```

2. Create ZIP:
   ```bash
   cd dist
   zip -r ../jobflow-extension.zip *
   ```

3. Upload to Chrome Web Store:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Create new item
   - Upload ZIP
   - Fill in listing details
   - Submit for review

---

## Monitoring & Analytics

### Error Tracking (Sentry)

```bash
pnpm add @sentry/nextjs @sentry/node
```

Configure in `apps/web/sentry.config.js` and `packages/api/sentry.config.js`

### Analytics (PostHog)

```bash
pnpm add posthog-js posthog-node
```

### Logging

Use structured logging with Winston or Pino:

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
})

logger.info({ userId: '123' }, 'User logged in')
```

---

## Troubleshooting

### Common Issues

**1. Database connection errors**:
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
pnpm db:migrate reset
```

**2. Extension not loading**:
- Check manifest.json syntax
- Verify all files in dist folder
- Check Chrome console for errors
- Try removing and re-adding extension

**3. AI API rate limits**:
- Implement caching for similar requests
- Use Redis to cache pattern analyses
- Add rate limiting in extension

**4. CORS errors**:
```typescript
// packages/api/src/index.ts
app.use(cors({
  origin: ['http://localhost:3000', 'chrome-extension://*'],
  credentials: true
}))
```

---

## Next Steps

1. **Complete Phase 1 Tasks**:
   - ✅ Monorepo setup
   - ✅ Next.js web app
   - ✅ Database schema
   - ✅ Authentication
   - [ ] User profile CRUD
   - [ ] Basic UI components

2. **Start Building Core Features**:
   - Job tracker dashboard
   - Application form
   - Document upload

3. **Develop Extension**:
   - Form detection
   - Basic autofill
   - Recording functionality

4. **Integrate AI**:
   - Pattern analysis
   - Field mapping
   - Automation script generation

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)

---

## Support

For issues or questions:
- Check [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for technical details
- Review [CONSOLIDATED_FEATURE_SET.md](./CONSOLIDATED_FEATURE_SET.md) for feature specs
- Open an issue in the repository

Happy coding! 🚀
