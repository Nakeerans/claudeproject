# System Architecture

## Overview

The Autonomous AI Web System is a modular, cloud-native application that combines AI-powered code generation with web scraping capabilities, browser extension support, and full DevOps automation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interfaces                          │
├──────────────────┬──────────────────┬─────────────────────────┤
│  Web Browser     │  REST API        │  Browser Extension       │
│  (Playwright)    │  Clients         │  (Chrome/Firefox)        │
└────────┬─────────┴────────┬─────────┴──────────┬──────────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Gateway   │
                    │  (Express.js)   │
                    └───────┬─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐      ┌──────▼───────┐    ┌─────▼─────┐
    │   AI   │      │     MCP      │    │  Scraper  │
    │ Engine │◄─────┤ Orchestrator │────►│  Module   │
    └───┬────┘      └──────┬───────┘    └─────┬─────┘
        │                  │                   │
        │           ┌──────▼──────┐            │
        │           │   Agents    │            │
        │           │ - CodeGen   │            │
        │           │ - Validator │            │
        │           │ - Testing   │            │
        │           └─────────────┘            │
        │                                      │
    ┌───▼──────────────────────────────────────▼────┐
    │           External Services                    │
    ├────────────────┬──────────────┬───────────────┤
    │  Claude AI     │  Puppeteer   │  Web Targets  │
    │  API           │  Browser     │               │
    └────────────────┴──────────────┴───────────────┘

         ┌────────────────────────────────┐
         │      Infrastructure Layer       │
         ├────────────┬───────────────────┤
         │   AWS EC2  │  CloudWatch       │
         │   ECS      │  Monitoring       │
         └────────────┴───────────────────┘
```

## Core Components

### 1. AI Engine (`src/ai-engine/`)

**Responsibilities:**
- Interface with Claude AI API
- Code generation and validation
- Test generation
- Code refactoring

**Key Features:**
- Asynchronous operations
- Error handling and retries
- Token management
- Response parsing

**API:**
```javascript
- generateCode(prompt, options)
- validateCode(code, language)
- refactorCode(code, instructions)
- generateTests(code, framework)
```

### 2. Model Control Plane (`src/mcp/`)

**Responsibilities:**
- Agent orchestration
- Workflow management
- Task distribution
- Result aggregation

**Architecture:**
```
MCP Orchestrator
├── Agent Registry
│   ├── Code Generator Agent
│   ├── Validator Agent
│   ├── Test Generator Agent
│   └── Refactorer Agent
├── Workflow Engine
│   └── Workflow Definitions
└── Execution Context
```

**Workflow Example:**
```javascript
fullDevelopmentCycle:
  1. Generate Code (critical)
  2. Validate Code (critical)
  3. Generate Tests (non-critical)
  4. Refactor if needed (non-critical)
```

### 3. Web Scraper (`src/scraper/`)

**Capabilities:**
- Static HTML scraping (Axios + Cheerio)
- Dynamic JavaScript scraping (Puppeteer)
- Plugin architecture
- Batch processing

**Scraping Modes:**

**Static Scraping:**
- Fast and lightweight
- Good for simple HTML
- Lower resource usage

**Dynamic Scraping:**
- Handles JavaScript-heavy sites
- Can interact with pages
- Screenshot capabilities

### 4. Browser Extension (`src/browser-extension/`)

**Architecture:**
```
Extension Components
├── Manifest (manifest.json)
├── Background Service Worker
│   ├── API Communication
│   ├── Plugin Registry
│   └── Message Handler
├── Content Script
│   ├── Page Interaction
│   ├── Element Selection
│   └── Data Extraction
└── Popup UI
    ├── Quick Actions
    ├── Code Generation
    └── Status Display
```

**Communication Flow:**
```
Content Script → Background Worker → Backend API → AI Engine
      ↑                                                  ↓
      └──────────────── Results ────────────────────────┘
```

### 5. API Layer (`src/api/`)

**Endpoints:**
```
/health              - Health check
/api/generate-code   - Code generation
/api/validate-code   - Code validation
/api/generate-tests  - Test generation
/api/scrape          - Web scraping
/api/execute-workflow - Workflow execution
/api/mcp/status      - MCP status
```

## Data Flow

### Code Generation Flow

```
1. User Request
   ↓
2. API Endpoint (/api/generate-code)
   ↓
3. AI Engine (generateCode)
   ↓
4. Claude AI API
   ↓
5. Response Processing
   ↓
6. Return to User
```

### Workflow Execution Flow

```
1. User Request (/api/execute-workflow)
   ↓
2. MCP Orchestrator
   ↓
3. For each workflow step:
   ├─ Get Agent from Registry
   ├─ Execute Agent
   ├─ Collect Result
   └─ Pass context to next step
   ↓
4. Aggregate Results
   ↓
5. Return to User
```

### Web Scraping Flow

```
1. User Request (/api/scrape)
   ↓
2. Scraper Module
   ↓
3. Mode Selection (Static/Dynamic)
   ↓
4. If Dynamic:
   ├─ Launch Browser
   ├─ Navigate to URL
   ├─ Execute Actions
   ├─ Extract Data
   └─ Close Browser
   ↓
5. Return Structured Data
```

## Infrastructure Architecture

### AWS Deployment

```
                    Internet
                       │
                ┌──────▼──────┐
                │  Elastic IP  │
                └──────┬───────┘
                       │
              ┌────────▼─────────┐
              │  Application LB   │
              │  (Optional)       │
              └────────┬──────────┘
                       │
          ┌────────────┼────────────┐
          │                         │
    ┌─────▼──────┐          ┌──────▼─────┐
    │  EC2 / ECS │          │  EC2 / ECS │
    │  Instance  │          │  Instance  │
    └─────┬──────┘          └──────┬─────┘
          │                        │
          └────────────┬───────────┘
                       │
              ┌────────▼─────────┐
              │  CloudWatch      │
              │  Logs & Metrics  │
              └──────────────────┘
```

### Terraform Structure

```
infrastructure/terraform/
├── main.tf         - Main infrastructure
│   ├── VPC & Networking
│   ├── Security Groups
│   ├── EC2 Instances
│   └── CloudWatch
├── variables.tf    - Input variables
├── outputs.tf      - Output values
└── user-data.sh    - Instance initialization
```

## CI/CD Pipeline

```
GitHub Push/PR
      │
      ▼
┌─────────────────┐
│  Lint & Test    │
│  - ESLint       │
│  - Playwright   │
│  - Jest         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Extension │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Terraform Plan  │
│ (PR only)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Deploy       │
│ - Dev (develop) │
│ - Prod (main)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health Check   │
│  & Monitoring   │
└─────────────────┘
```

## Security Architecture

### Authentication & Authorization
```
Currently: No authentication (development only)

Production Should Include:
├── API Key Authentication
├── JWT Token Management
├── Rate Limiting
└── CORS Configuration
```

### Secrets Management
```
Development:
└── .env file (gitignored)

Production:
├── AWS Secrets Manager
├── Environment Variables
└── Encrypted at rest
```

### Network Security
```
├── VPC with Public/Private Subnets
├── Security Groups (least privilege)
├── HTTPS/TLS Encryption
└── WAF (Optional)
```

## Monitoring & Observability

### CloudWatch Metrics

**Application Metrics:**
- API request count
- API latency
- Error rates
- AI token usage

**Infrastructure Metrics:**
- CPU utilization
- Memory usage
- Network traffic
- Disk I/O

**Custom Metrics:**
```javascript
- AIOperation
- ScrapingOperation
- ModuleHealth
- ErrorCount
```

### Logging Strategy

**Log Levels:**
- ERROR: Application errors
- WARN: Warnings and degraded states
- INFO: Important events
- DEBUG: Detailed debugging info

**Log Aggregation:**
```
Application Logs
      ↓
Winston Logger
      ↓
CloudWatch Logs
      ↓
CloudWatch Insights
      ↓
Alarms & Dashboards
```

## Scalability Considerations

### Horizontal Scaling
- Load balancer with multiple instances
- Auto-scaling based on CPU/memory
- Session-less design

### Vertical Scaling
- Increase instance size
- Optimize Node.js heap size
- Database caching

### Performance Optimization
- Response caching
- Connection pooling
- Lazy loading
- Code splitting

## Disaster Recovery

### Backup Strategy
- Terraform state backup (S3)
- Application code (Git)
- Configuration backup
- Database snapshots (if applicable)

### Rollback Strategy
- Terraform state rollback
- Git revert
- Previous deployment re-run
- Automatic health check failures

## Technology Stack

**Backend:**
- Node.js 20
- Express.js
- Anthropic SDK
- MCP SDK

**Web Scraping:**
- Puppeteer
- Cheerio
- Axios

**Testing:**
- Playwright
- Jest

**Infrastructure:**
- Terraform
- AWS (EC2, CloudWatch, VPC)
- GitHub Actions

**Browser Extension:**
- Chrome Extensions API
- Service Workers
- Content Scripts

## Design Patterns

**Used Patterns:**
- Singleton (Logger, Monitoring)
- Factory (Agent Creation)
- Strategy (Scraping Modes)
- Observer (Event Handling)
- Plugin Architecture (Extension System)

## Future Enhancements

- [ ] GraphQL API
- [ ] WebSocket support
- [ ] Kubernetes deployment
- [ ] Multi-region setup
- [ ] Advanced caching
- [ ] Real-time collaboration
- [ ] Natural language workflow definition
