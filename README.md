# Autonomous AI Web System

A comprehensive modular system that integrates Claude AI, autonomous agents, web scraping, and browser extensions with full CI/CD pipeline and AWS infrastructure-as-code deployment.

## Features

- **AI-Powered Code Generation**: Leverage Claude AI for autonomous code generation, refactoring, and validation
- **Model Control Plane (MCP)**: Orchestrate multiple AI agents and workflows
- **Web Scraping**: Static and dynamic scraping with Puppeteer and Cheerio
- **Browser Extension**: Chrome/Firefox extension with plugin architecture for custom scraping and automation
- **Automated Testing**: Playwright-based UI/UX testing framework
- **CI/CD Pipeline**: GitHub Actions workflow with automated testing and deployment
- **Infrastructure as Code**: Terraform configuration for AWS EC2/ECS deployment
- **Monitoring & Rollback**: CloudWatch integration with automatic rollback mechanisms

## Architecture

```
autonomous-ai-system/
├── src/
│   ├── ai-engine/          # Claude AI integration
│   ├── mcp/                # Model Control Plane orchestrator
│   ├── scraper/            # Web scraping module
│   ├── browser-extension/  # Chrome/Firefox extension
│   ├── api/                # REST API endpoints
│   └── utils/              # Shared utilities
├── infrastructure/
│   └── terraform/          # AWS infrastructure
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # Playwright E2E tests
├── .github/workflows/     # CI/CD pipelines
└── docs/                  # Documentation
```

## Prerequisites

- Node.js 20+
- npm or yarn
- AWS Account (for deployment)
- Anthropic API Key (for Claude AI)
- Terraform 1.5+ (for infrastructure)

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd claudeproject

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys
# ANTHROPIC_API_KEY=your_key_here
```

### 2. Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run Playwright tests
npm run test:e2e

# Build browser extension
npm run build:extension
```

### 3. API Usage

The system exposes several API endpoints:

#### Generate Code
```bash
curl -X POST http://localhost:3000/api/generate-code \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a function that sorts an array",
    "language": "javascript"
  }'
```

#### Validate Code
```bash
curl -X POST http://localhost:3000/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 42; }",
    "language": "javascript"
  }'
```

#### Scrape Website
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "selectors": {
      "title": "h1",
      "content": "p"
    }
  }'
```

#### Execute Workflow
```bash
curl -X POST http://localhost:3000/api/execute-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflowName": "fullDevelopmentCycle",
    "context": {
      "requirements": "Create a REST API endpoint"
    }
  }'
```

## Browser Extension

### Installation

1. Build the extension:
```bash
npm run build:extension
```

2. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `src/browser-extension/dist/`

### Features

- **Element Selection**: Click to select and scrape specific page elements
- **Auto Extract**: Automatically extract structured data from pages
- **AI Code Generation**: Generate code directly from the browser
- **Plugin System**: Extend functionality with custom plugins

### Usage Example

```javascript
// Register a custom plugin
chrome.runtime.sendMessage({
  action: 'registerPlugin',
  plugin: {
    name: 'customScraper',
    execute: async (context) => {
      // Custom scraping logic
      return { data: 'scraped' };
    }
  }
});

// Execute plugin
chrome.runtime.sendMessage({
  action: 'executePlugin',
  pluginName: 'customScraper',
  context: { url: 'https://example.com' }
});
```

## AI Engine

### Code Generation

```javascript
import { AIEngine } from './src/ai-engine/engine.js';

const engine = new AIEngine();

// Generate code
const code = await engine.generateCode(
  'Create a React component for a user profile',
  { maxTokens: 2048 }
);

// Refactor code
const result = await engine.refactorCode(
  existingCode,
  'Optimize for performance and add error handling'
);

// Validate code
const validation = await engine.validateCode(
  code,
  'javascript'
);

// Generate tests
const tests = await engine.generateTests(code, 'jest');
```

## MCP Orchestrator

### Workflow Orchestration

```javascript
import { MCPOrchestrator } from './src/mcp/orchestrator.js';

const orchestrator = new MCPOrchestrator(aiEngine);
await orchestrator.initialize();

// Define custom workflow
orchestrator.defineWorkflow('deploymentPipeline', [
  {
    name: 'generateCode',
    agentName: 'codeGenerator',
    critical: true,
    config: {}
  },
  {
    name: 'validate',
    agentName: 'validator',
    critical: true,
    config: {}
  },
  {
    name: 'generateTests',
    agentName: 'testGenerator',
    critical: false,
    config: {}
  }
]);

// Execute workflow
const result = await orchestrator.executeWorkflow(
  'deploymentPipeline',
  { requirements: 'User authentication system' }
);
```

## Web Scraping

### Static Scraping

```javascript
import { WebScraper } from './src/scraper/scraper.js';

const scraper = new WebScraper();

const result = await scraper.scrapeStatic(
  'https://example.com',
  {
    title: 'h1',
    links: 'a',
    paragraphs: 'p'
  }
);
```

### Dynamic Scraping

```javascript
const result = await scraper.scrapeDynamic(
  'https://spa-app.com',
  {
    waitForSelector: '.content',
    selectors: {
      data: '.data-item'
    },
    actions: [
      { type: 'click', selector: '.load-more' },
      { type: 'wait', duration: 2000 }
    ]
  }
);
```

### Plugin System

```javascript
// Register custom scraping plugin
scraper.registerPlugin('priceScraper', async (context, scraper) => {
  const result = await scraper.scrapeDynamic(context.url, {
    selectors: {
      prices: '.price',
      products: '.product-name'
    }
  });

  return {
    products: result.data.products.map((name, i) => ({
      name,
      price: result.data.prices[i]
    }))
  };
});

// Execute plugin
const prices = await scraper.executePlugin('priceScraper', {
  url: 'https://shop.example.com'
});
```

## AWS Deployment

### Using Terraform

```bash
# Navigate to Terraform directory
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
environment = "prod"
instance_type = "t3.medium"
anthropic_api_key = "your-api-key"
EOF

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# Get outputs
terraform output
```

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to existing EC2 instance
scp -r dist/ user@your-instance:/opt/autonomous-ai/
ssh user@your-instance 'cd /opt/autonomous-ai && npm install && pm2 restart all'
```

## CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

- **Lint & Test**: Runs on all PRs and commits
- **Build Extension**: Packages browser extension
- **Terraform Plan**: Shows infrastructure changes
- **Deploy Dev**: Auto-deploys develop branch
- **Deploy Prod**: Deploys main branch with health checks
- **Security Scan**: npm audit + Snyk integration

### GitHub Secrets Required

```
ANTHROPIC_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SNYK_TOKEN (optional)
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests with Playwright

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/api.spec.js

# Run with UI
npx playwright test --ui

# Generate report
npx playwright show-report
```

## Monitoring

### CloudWatch Integration

The system automatically sends metrics to CloudWatch:

- API request counts and latency
- AI operation metrics and token usage
- Scraping operation success rates
- Error tracking
- Module health status

### Rollback Mechanism

```javascript
import { RollbackManager } from './src/utils/monitoring.js';

const rollbackManager = new RollbackManager();

// Save deployment state
rollbackManager.saveDeploymentState({
  version: '1.0.0',
  commit: 'abc123'
});

// Rollback if needed
await rollbackManager.rollback(1); // Rollback 1 step
```

## Configuration

### Environment Variables

```env
# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# MCP
MCP_SERVER_URL=http://localhost:3001

# Monitoring
CLOUDWATCH_LOG_GROUP=/aws/app/autonomous-ai-system
```

## Project Structure Details

### Core Modules

- **ai-engine/engine.js**: Claude AI integration with code generation, validation, and testing
- **mcp/orchestrator.js**: Agent coordination and workflow management
- **scraper/scraper.js**: Web scraping with static/dynamic support
- **api/routes.js**: REST API endpoints
- **utils/logger.js**: Winston-based logging
- **utils/monitoring.js**: CloudWatch metrics and rollback

### Browser Extension

- **manifest.json**: Extension configuration
- **background/service-worker.js**: Background processes and API communication
- **content/content-script.js**: Page interaction and element selection
- **popup/**: User interface for quick actions

## Best Practices

1. **Security**: Never commit API keys or secrets
2. **Testing**: Write tests for all new features
3. **Logging**: Use structured logging for debugging
4. **Error Handling**: Implement proper error boundaries
5. **Monitoring**: Track key metrics in production
6. **Documentation**: Keep README and docs updated

## Troubleshooting

### Common Issues

**Issue**: Cannot connect to API
```bash
# Check if server is running
curl http://localhost:3000/health

# Check logs
tail -f logs/combined.log
```

**Issue**: Terraform deployment fails
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check Terraform state
cd infrastructure/terraform && terraform show
```

**Issue**: Browser extension not loading
```bash
# Rebuild extension
npm run build:extension

# Check Chrome extension console for errors
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/your-repo/issues)
- Documentation: [docs/](./docs/)

## Roadmap

- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] GraphQL API
- [ ] WebSocket support for real-time updates
- [ ] Multi-region AWS deployment
- [ ] Advanced AI agent collaboration
- [ ] Natural language workflow definition
- [ ] Browser extension for Firefox and Edge
- [ ] Mobile app integration

---

Built with Claude AI and modern DevOps practices
