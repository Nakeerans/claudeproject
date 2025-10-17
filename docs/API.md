# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-15T10:00:00.000Z",
  "modules": {
    "aiEngine": true,
    "mcp": true,
    "scraper": true
  }
}
```

### Generate Code

```
POST /api/generate-code
```

**Request Body:**
```json
{
  "prompt": "Create a function that calculates fibonacci numbers",
  "language": "javascript",
  "maxTokens": 2048
}
```

**Response:**
```json
{
  "success": true,
  "code": "function fibonacci(n) { ... }",
  "language": "javascript"
}
```

### Validate Code

```
POST /api/validate-code
```

**Request Body:**
```json
{
  "code": "function hello() { return 'world'; }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "valid": true,
    "feedback": "Code looks good...",
    "suggestions": ["Consider adding JSDoc comments"]
  }
}
```

### Generate Tests

```
POST /api/generate-tests
```

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "framework": "jest"
}
```

**Response:**
```json
{
  "success": true,
  "tests": "describe('add', () => { ... })"
}
```

### Scrape Website

```
POST /api/scrape
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "dynamic": false,
  "selectors": {
    "title": "h1",
    "content": "p"
  },
  "options": {
    "waitForSelector": ".content",
    "timeout": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "method": "static",
    "data": {
      "title": ["Example Domain"],
      "content": ["This domain is for use in examples..."]
    },
    "timestamp": "2025-10-15T10:00:00.000Z"
  }
}
```

### Execute Workflow

```
POST /api/execute-workflow
```

**Request Body:**
```json
{
  "workflowName": "fullDevelopmentCycle",
  "context": {
    "requirements": "Create a user authentication system",
    "language": "javascript"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "workflow": "fullDevelopmentCycle",
    "status": "completed",
    "results": [
      {
        "step": "generate",
        "status": "success",
        "result": "// Generated code..."
      },
      {
        "step": "validate",
        "status": "success",
        "result": { "valid": true }
      }
    ]
  }
}
```

### MCP Status

```
GET /api/mcp/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "ready": true,
    "agentCount": 4,
    "workflowCount": 1,
    "registeredAgents": ["codeGenerator", "validator", "testGenerator", "refactorer"],
    "availableWorkflows": ["fullDevelopmentCycle"]
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Prompt is required"
}
```

### 500 Internal Server Error

```json
{
  "error": "Code generation failed: API error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting based on:
- IP address
- API key
- User account

## Authentication

The current implementation doesn't include authentication. For production use, implement:
- API key authentication
- JWT tokens
- OAuth 2.0

## CORS

CORS is not configured by default. To enable:

```javascript
import cors from 'cors';
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
}));
```
