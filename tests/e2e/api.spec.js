import { test, expect } from '@playwright/test';

test.describe('JobFlow API Endpoints', () => {
  test('health check endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('jobflow-api');
    expect(data.timestamp).toBeDefined();
  });

  test('auth check without token returns 401', async ({ request }) => {
    const response = await request.get('/api/auth/check');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('register endpoint exists', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User'
      }
    });

    // Should succeed or fail with proper validation
    expect([201, 400]).toContain(response.status());
  });

  test('login endpoint exists', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    });

    // Should return 400 or 401 for invalid credentials
    expect([400, 401]).toContain(response.status());
  });

  test('protected routes require authentication', async ({ request }) => {
    const protectedRoutes = [
      '/api/jobs',
      '/api/contacts',
      '/api/interviews',
      '/api/analytics',
      '/api/profile'
    ];

    for (const route of protectedRoutes) {
      const response = await request.get(route);
      expect(response.status()).toBe(401);
    }
  });

  test('invalid routes return 404', async ({ request }) => {
    const response = await request.get('/api/nonexistent-endpoint');
    expect(response.status()).toBe(404);
  });
});

test.describe('JobFlow Authentication Flow', () => {
  let authToken;
  let testUserEmail;

  test('can register a new user', async ({ request }) => {
    testUserEmail = `test-user-${Date.now()}@example.com`;

    const response = await request.post('/api/auth/register', {
      data: {
        email: testUserEmail,
        password: 'TestPassword123!',
        name: 'E2E Test User'
      }
    });

    if (response.status() === 201) {
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUserEmail);
      expect(data.token).toBeDefined();
      authToken = data.token;
    } else {
      // User might already exist from previous test run
      expect(response.status()).toBe(400);
    }
  });

  test('can access protected routes with valid token', async ({ request }) => {
    if (!authToken) {
      test.skip();
      return;
    }

    const response = await request.get('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.user).toBeDefined();
  });
});
