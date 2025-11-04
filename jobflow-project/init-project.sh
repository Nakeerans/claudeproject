#!/bin/bash

# JobFlow - Automated Project Initialization Script
# This script sets up the complete monorepo structure for the job application platform

set -e  # Exit on error

echo "🚀 JobFlow Project Initialization"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✅ pnpm $(pnpm -v)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not found. You'll need to install it separately.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL installed${NC}"
fi

echo ""
echo "📁 Creating project structure..."

# Create root project directory
PROJECT_ROOT="../job-application-platform"

if [ -d "$PROJECT_ROOT" ]; then
    echo -e "${YELLOW}⚠️  Directory $PROJECT_ROOT already exists.${NC}"
    read -p "Do you want to remove it and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_ROOT"
    else
        echo "Exiting..."
        exit 0
    fi
fi

mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

echo -e "${GREEN}✅ Created project directory${NC}"

# Create directory structure
echo "Creating directory structure..."
mkdir -p apps/web apps/extension
mkdir -p packages/api packages/database packages/shared packages/ui
mkdir -p tools/learning-engine
mkdir -p docs

# Initialize pnpm workspace
echo "Initializing pnpm workspace..."
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
EOF

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "job-application-platform",
  "version": "1.0.0",
  "private": true,
  "description": "AI-powered job application platform with intelligent autofill",
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
    "db:seed": "cd packages/database && pnpm prisma db seed",
    "db:reset": "cd packages/database && pnpm prisma migrate reset"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  },
  "packageManager": "pnpm@8.0.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
EOF

# Install root dependencies
echo "Installing root dependencies..."
pnpm install

# Create Turborepo config
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
*.log

# Next.js
.next
out
build
dist

# Production
*.tsbuildinfo

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Turbo
.turbo

# Prisma
packages/database/prisma/migrations

# IDE
.vscode
.idea
*.swp
*.swo
EOF

echo -e "${GREEN}✅ Root configuration complete${NC}"

# ===============================
# SET UP WEB APP (Next.js)
# ===============================
echo ""
echo "🌐 Setting up Next.js web application..."
cd apps/web

# Create Next.js app
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --yes

# Install additional dependencies
pnpm add \
  @tanstack/react-query \
  @tanstack/react-query-devtools \
  zustand \
  next-auth \
  @auth/prisma-adapter \
  @prisma/client \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react \
  date-fns \
  zod \
  react-hook-form \
  @hookform/resolvers

pnpm add -D \
  @types/node \
  @types/react \
  @types/react-dom

echo -e "${GREEN}✅ Web app dependencies installed${NC}"

# Update package.json name
cat > package.json << 'EOF'
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
EOF

pnpm install

cd ../..

# ===============================
# SET UP DATABASE (Prisma)
# ===============================
echo ""
echo "🗄️  Setting up database package..."
cd packages/database

cat > package.json << 'EOF'
{
  "name": "database",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "scripts": {
    "dev": "echo 'Database package has no dev server'",
    "build": "prisma generate",
    "studio": "prisma studio"
  }
}
EOF

pnpm add @prisma/client
pnpm add -D prisma typescript @types/node

# Initialize Prisma
pnpm prisma init --datasource-provider postgresql

# Create basic schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Basic schema - will be expanded
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  avatar        String?
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
}

enum Plan {
  FREE
  PREMIUM
  ENTERPRISE
}
EOF

# Create .env template
cat > .env.example << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/jobflow?schema=public"
EOF

echo -e "${GREEN}✅ Database package configured${NC}"
cd ../..

# ===============================
# SET UP API
# ===============================
echo ""
echo "🔌 Setting up API package..."
cd packages/api

cat > package.json << 'EOF'
{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts"
  }
}
EOF

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
  @types/node \
  typescript \
  tsx

# Create tsconfig
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create basic API structure
mkdir -p src/routes
cat > src/index.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`)
})
EOF

echo -e "${GREEN}✅ API package configured${NC}"
cd ../..

# ===============================
# SET UP CHROME EXTENSION
# ===============================
echo ""
echo "🧩 Setting up Chrome extension..."
cd apps/extension

cat > package.json << 'EOF'
{
  "name": "extension",
  "version": "1.0.0",
  "private": true,
  "description": "JobFlow Chrome Extension - Intelligent job application autofill",
  "scripts": {
    "dev": "webpack --watch --mode development",
    "build": "webpack --mode production",
    "build:prod": "NODE_ENV=production webpack --mode production"
  }
}
EOF

pnpm add webextension-polyfill

pnpm add -D \
  typescript \
  @types/chrome \
  @types/webextension-polyfill \
  webpack \
  webpack-cli \
  ts-loader \
  copy-webpack-plugin

# Create manifest
mkdir -p icons
cat > manifest.json << 'EOF'
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
  }
}
EOF

# Create webpack config
cat > webpack.config.js << 'EOF'
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts'
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
        { from: 'icons', to: 'icons', noErrorOnMissing: true },
        { from: 'styles', to: 'styles', noErrorOnMissing: true }
      ]
    })
  ]
};
EOF

# Create tsconfig
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create basic extension files
mkdir -p src

cat > src/background.ts << 'EOF'
console.log('JobFlow extension background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('JobFlow extension installed');
});
EOF

cat > src/content.ts << 'EOF'
console.log('JobFlow content script loaded');

// Detect forms on page
function detectForms() {
  const forms = document.querySelectorAll('form');
  console.log(`Found ${forms.length} forms on page`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectForms);
} else {
  detectForms();
}
EOF

cat > src/popup.ts << 'EOF'
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('status')!.textContent = 'JobFlow Extension Active';
});
EOF

cat > popup.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>JobFlow</title>
  <style>
    body {
      width: 300px;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    h1 {
      font-size: 18px;
      margin: 0 0 10px 0;
    }
  </style>
</head>
<body>
  <h1>JobFlow</h1>
  <p id="status">Loading...</p>
  <script src="popup.js"></script>
</body>
</html>
EOF

mkdir -p styles
cat > styles/content.css << 'EOF'
/* Content script styles */
.jobflow-highlight {
  outline: 2px solid #667eea !important;
}
EOF

echo -e "${GREEN}✅ Chrome extension configured${NC}"
cd ../..

# ===============================
# SET UP SHARED PACKAGES
# ===============================
echo ""
echo "📦 Setting up shared packages..."

# Shared types
cd packages/shared
cat > package.json << 'EOF'
{
  "name": "shared",
  "version": "1.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts"
}
EOF

mkdir -p types
cat > types/index.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Application {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  createdAt: Date;
}

export enum ApplicationStatus {
  SAVED = 'SAVED',
  APPLIED = 'APPLIED',
  INTERVIEWING = 'INTERVIEWING',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED'
}
EOF

cat > index.ts << 'EOF'
export * from './types';
EOF

cd ../..

# ===============================
# CREATE ENVIRONMENT FILES
# ===============================
echo ""
echo "🔐 Creating environment templates..."

# Web app
cat > apps/web/.env.example << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jobflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-xxx"

# Optional: AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_BUCKET_NAME="jobflow-uploads"
AWS_REGION="us-east-1"
EOF

# API
cat > packages/api/.env.example << 'EOF'
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jobflow"

# JWT
JWT_SECRET="your-jwt-secret-change-in-production"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-xxx"

# Optional: Redis
REDIS_URL="redis://localhost:6379"
EOF

# Extension
cat > apps/extension/.env.example << 'EOF'
API_BASE_URL="http://localhost:3001"
EOF

echo -e "${GREEN}✅ Environment templates created${NC}"

# ===============================
# CREATE README
# ===============================
cat > README.md << 'EOF'
# JobFlow - Intelligent Job Application Platform

AI-powered job application platform with Chrome extension that learns from your manual interactions.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up database:
   ```bash
   # Copy environment files
   cp apps/web/.env.example apps/web/.env.local
   cp packages/api/.env.example packages/api/.env

   # Update DATABASE_URL in both files

   # Run migrations
   pnpm db:migrate
   ```

3. Start development servers:
   ```bash
   # Terminal 1: Web app
   pnpm dev:web

   # Terminal 2: API
   pnpm dev:api

   # Terminal 3: Extension (build watch mode)
   pnpm dev:extension
   ```

4. Load extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `apps/extension/dist` folder

## Documentation

- [System Architecture](../simplify-ai-analyzer/SYSTEM_ARCHITECTURE.md)
- [Feature Set](../simplify-ai-analyzer/CONSOLIDATED_FEATURE_SET.md)
- [Setup Guide](../simplify-ai-analyzer/PROJECT_SETUP_GUIDE.md)

## Project Structure

```
├── apps/
│   ├── web/          # Next.js web application
│   └── extension/    # Chrome extension
├── packages/
│   ├── api/          # Express API server
│   ├── database/     # Prisma schema
│   ├── shared/       # Shared types
│   └── ui/           # Shared components
└── tools/
    └── learning-engine/  # AI pattern analyzer
```

## Scripts

- `pnpm dev` - Start all dev servers
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL, Prisma
- **Extension**: Chrome Manifest V3
- **AI**: Claude 3.5 Sonnet (Anthropic)

## License

MIT
EOF

echo ""
echo -e "${GREEN}✅ Project initialization complete!${NC}"
echo ""
echo "📍 Project location: $PROJECT_ROOT"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_ROOT"
echo "  2. Copy .env.example files and update with your credentials"
echo "  3. Run: pnpm db:migrate"
echo "  4. Run: pnpm dev"
echo ""
echo "📚 Documentation:"
echo "  - README.md (project overview)"
echo "  - SYSTEM_ARCHITECTURE.md (technical details)"
echo "  - PROJECT_SETUP_GUIDE.md (detailed setup)"
echo ""
echo "Happy coding! 🚀"
