# Quick Start Guide

Get up and running with the Autonomous AI Web System in 5 minutes!

## Prerequisites

- Node.js 20+
- npm
- Anthropic API key

## Installation (Method 1: Automated)

```bash
# Run the setup script
./setup.sh

# Edit environment variables
nano .env
# Add your ANTHROPIC_API_KEY

# Start the server
npm run dev
```

## Installation (Method 2: Manual)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Create logs directory
mkdir -p logs

# 4. Install Playwright browsers
npx playwright install

# 5. Build browser extension
npm run build:extension

# 6. Start development server
npm run dev
```

## First API Call

Once the server is running, test it:

```bash
# Health check
curl http://localhost:3000/health

# Generate code
curl -X POST http://localhost:3000/api/generate-code \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a hello world function"}'
```

## Test Browser Extension

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `src/browser-extension/dist/`
6. The extension icon should appear in your toolbar

## Run Tests

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Run with UI
npx playwright test --ui
```

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [docs/API.md](docs/API.md) for API reference
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for AWS deployment
- Review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design

## Common Issues

**Port 3000 already in use:**
```bash
# Change port in .env
PORT=3001
```

**Missing API key:**
```bash
# Make sure .env has:
ANTHROPIC_API_KEY=sk-ant-...
```

**Playwright browsers not installed:**
```bash
npx playwright install
```

## Project Structure

```
claudeproject/
├── src/               # Source code
│   ├── ai-engine/    # Claude AI integration
│   ├── mcp/          # Orchestrator
│   ├── scraper/      # Web scraping
│   └── browser-extension/
├── tests/            # Test files
├── infrastructure/   # Terraform IaC
├── docs/            # Documentation
└── scripts/         # Build scripts
```

## Available Commands

```bash
npm run dev              # Start development server
npm test                 # Run all tests
npm run test:e2e         # Run E2E tests
npm run build:extension  # Build browser extension
npm run lint            # Run linter
npm run format          # Format code
```

## Getting Help

- GitHub Issues: Report bugs or request features
- Documentation: See `docs/` folder
- Examples: Check test files in `tests/e2e/`

Happy coding!
