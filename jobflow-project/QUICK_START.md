# JobFlow - Quick Start (Manual Setup)

Since the automated script requires pnpm installation with sudo permissions, here's a manual setup guide using npm.

## Manual Setup Steps

### 1. Install pnpm (Optional but Recommended)

If you have sudo access:
```bash
sudo npm install -g pnpm
```

Or use Homebrew (recommended for macOS):
```bash
brew install pnpm
```

Or use standalone script (no sudo needed):
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 2. Create Project Manually (Using npm if pnpm not available)

```bash
# Create project directory
mkdir -p ../job-application-platform
cd ../job-application-platform

# Initialize with npm
npm init -y

# Install Turborepo
npm install turbo -D

# Create directory structure
mkdir -p apps/web apps/extension
mkdir -p packages/api packages/database packages/shared
mkdir -p tools/learning-engine
```

### 3. Set Up Next.js Web App

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install dependencies
npm install \
  @tanstack/react-query \
  zustand \
  next-auth \
  @prisma/client \
  lucide-react \
  date-fns \
  zod \
  react-hook-form

cd ../..
```

### 4. Set Up Backend API

```bash
cd packages/api

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
npm install express cors dotenv @anthropic-ai/sdk

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
EOF

cd ../..
```

### 5. Set Up Chrome Extension

```bash
cd apps/extension

# Create package.json
cat > package.json << 'EOF'
{
  "name": "extension",
  "version": "1.0.0",
  "scripts": {
    "build": "node build.js"
  }
}
EOF

# Create manifest
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

# Create content script
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
    alert('Autofill coming soon! Extension is working.');
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

# Create popup
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

cd ../..
```

### 6. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select `job-application-platform/apps/extension` folder
5. Extension should now be loaded!

### 7. Test Extension

1. Visit any job application site (e.g., jobs.lever.co, greenhouse.io)
2. Look for the purple "⚡ JobFlow: Autofill" button in the top-right
3. Click it to verify the extension is working

### 8. Start Development Servers

```bash
# Terminal 1: Web app
cd apps/web
npm run dev

# Terminal 2: API server
cd packages/api
npm run dev
```

Visit:
- Web app: http://localhost:3000
- API health check: http://localhost:3001/health

## Next Steps

Now that you have the basic structure running:

1. **Review the architecture**: Read [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for detailed implementation guides

2. **Implement features progressively**:
   - Start with user authentication (NextAuth)
   - Add profile builder
   - Implement application tracker
   - Build the learning system

3. **Follow the roadmap**: See [README.md](./README.md) for the complete feature roadmap

4. **Install pnpm properly**: Once you have sudo access or use Homebrew, you can migrate to pnpm for better performance:
   ```bash
   # Convert from npm to pnpm
   pnpm import
   rm -rf node_modules package-lock.json
   pnpm install
   ```

## Troubleshooting

**Extension not loading?**
- Check manifest.json syntax
- Look at Chrome console (chrome://extensions/) for errors
- Ensure all files are in the extension folder

**API not starting?**
- Check if port 3001 is already in use
- Verify .env file exists
- Check for syntax errors in src/index.js

**Next.js not starting?**
- Clear .next folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Project Structure Created

```
job-application-platform/
├── apps/
│   ├── web/              # Next.js app (port 3000)
│   └── extension/        # Chrome extension (basic version)
├── packages/
│   ├── api/              # Express API (port 3001)
│   ├── database/         # To be added: Prisma
│   └── shared/           # To be added: Shared types
└── tools/
    └── learning-engine/  # To be added: AI learning system
```

## What's Next?

The basic structure is now set up. To build the complete JobFlow platform:

1. **Add Database**: Set up PostgreSQL and Prisma (see SYSTEM_ARCHITECTURE.md section 2.3)
2. **Implement Auth**: Add NextAuth.js for user authentication
3. **Build UI Components**: Use shadcn/ui for consistent UI
4. **Extension Features**: Implement recorder, autofill engine, and AI learning
5. **API Routes**: Create endpoints for applications, jobs, learning patterns

Refer to [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for complete implementation details with code examples.

---

Happy building! 🚀
