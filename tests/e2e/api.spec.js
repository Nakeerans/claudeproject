import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.modules).toBeDefined();
  });

  test('code generation endpoint works', async ({ request }) => {
    const response = await request.post('/api/generate-code', {
      data: {
        prompt: 'Create a simple hello world function in JavaScript',
        language: 'javascript'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.code).toBeDefined();
  });

  test('code validation endpoint works', async ({ request }) => {
    const response = await request.post('/api/validate-code', {
      data: {
        code: 'function hello() { return "world"; }',
        language: 'javascript'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.validation).toBeDefined();
  });

  test('scraping endpoint works', async ({ request }) => {
    const response = await request.post('/api/scrape', {
      data: {
        url: 'https://example.com',
        dynamic: false,
        selectors: {
          title: 'h1'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result).toBeDefined();
  });

  test('MCP status endpoint returns orchestrator status', async ({ request }) => {
    const response = await request.get('/api/mcp/status');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBeDefined();
    expect(data.status.ready).toBeDefined();
  });

  test('invalid requests return proper error codes', async ({ request }) => {
    const response = await request.post('/api/generate-code', {
      data: {}
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

test.describe('AI Engine Integration', () => {
  test('generates valid JavaScript code', async ({ request }) => {
    const response = await request.post('/api/generate-code', {
      data: {
        prompt: 'Create a function that adds two numbers',
        language: 'javascript'
      }
    });

    const data = await response.json();
    expect(data.code).toContain('function');
  });

  test('validates code correctly', async ({ request }) => {
    const response = await request.post('/api/validate-code', {
      data: {
        code: 'const x = 10;',
        language: 'javascript'
      }
    });

    const data = await response.json();
    expect(data.validation.valid).toBe(true);
  });
});
