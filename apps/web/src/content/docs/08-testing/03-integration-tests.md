# Integration Tests

<!-- AI_CONTEXT
This document covers API integration testing with Supertest.
Key files: apps/api/src/tests/auth.test.ts, apps/api/src/tests/health.test.ts, apps/api/src/tests/setup.ts, apps/api/src/tests/helpers.ts
IMPORTANT: app is a named export — import { app } from '../index' not import app from '../index'.
IMPORTANT: import './setup' must come BEFORE import { app } from '../index' — mocks must load first.
setup.ts mocks: data-source, bcrypt (conditional), ../utils/logger, pino-http.
bcrypt.compare mock: passes when hash === 'hashed-password' OR plain === 'correct-password'.
bcrypt.hash mock: always returns 'hashed-password'.
healthz response shape: { status: 'ok', timestamp: '...', version: '...' }.
readyz success: { status: 'ready', timestamp: '...' } — NOT 'ok', NOT checks.database.
readyz failure: 503, { status: 'not ready', error: '...' }.
Auth success response: { success: true, user: { ... } }.
409 duplicate: { error: 'ALREADY_EXISTS', message: '...already exists...' }.
401 invalid credentials: { error: 'INVALID_CREDENTIALS', message: '...' }.
request.agent(app) maintains session cookies across multiple requests.
helpers.ts: get(), post(), expectJson(), expectStatus(), createAuthenticatedAgent().
Related docs: overview, unit-tests, backend/api-routes
-->

## What Integration Tests Cover

A unit test checks one function in isolation. An integration test checks that multiple pieces work together correctly — routing, middleware, validation, and your handlers — as an HTTP conversation.

In App Shell, integration tests send real HTTP requests to the Express application and verify the response: the status code, the response body, and the headers. What they don't use is a real database. Instead, the database is replaced with mock functions that you control from the test. You decide what the "database" returns, and you can verify exactly how the code used it.

This means integration tests run fast (no actual I/O) while still exercising the full request lifecycle: route matching, authentication middleware, request validation, business logic, and error formatting.

## File Structure

```
apps/api/src/tests/
├── setup.ts              # Mock definitions — runs before the app loads
├── helpers.ts            # Utilities: get(), post(), expectJson(), expectStatus()
├── fixtures/
│   └── users.ts          # Pre-built test user objects
├── health.test.ts        # /healthz, /readyz, /api/version
└── auth.test.ts          # /api/auth/register, /api/auth/login
```

## How Mocking Works

`setup.ts` registers four mocks using Vitest's module mocking system. These mocks replace real modules before the app ever loads:

**`data-source`** — Replaces the TypeORM `AppDataSource` with a mock that has `isInitialized: true`, a `query` that returns a successful result, and a `getRepository` that returns a basic mock repository. Individual tests override `getRepository` to return their own mock with specific behavior.

**`bcrypt`** — Replacing bcrypt means tests don't spend time on password hashing. The mock is conditional so it mimics real bcrypt behavior:
- `bcrypt.hash()` always returns `'hashed-password'`
- `bcrypt.compare()` returns `true` when the plain text is `'correct-password'` OR when the hash is `'hashed-password'`

This means if you set a user's `passwordHash` to `'hashed-password'` in your test fixture (which `testUser` does), any password attempt will fail — unless you send `password: 'correct-password'`.

**`../utils/logger`** — Suppresses log output during tests. Without this, every test run prints request logs and error stacks to the terminal.

**`pino-http`** — The HTTP request logger middleware. Mocked to a passthrough so logging doesn't interfere with tests.

## The Import Order Rule

This is the most important rule in the test file structure:

```typescript
// ✅ CORRECT — setup loads mocks, THEN app loads
import './setup';
import { app } from '../index';

// ❌ WRONG — app loads before mocks are in place
import { app } from '../index';
import './setup';
```

`vi.mock()` calls in `setup.ts` are hoisted to the top of the module by Vitest's transform, but they still need to be registered before the modules that depend on them are imported. Importing `setup` first ensures the database mock, bcrypt mock, logger mock, and pino-http mock are all in place before Express wires up its routes.

Note that `app` is a **named** export from `index.ts`:

```typescript
import { app } from '../index'; // named export, not default
```

## Making Requests with Supertest

Supertest wraps your Express app and lets you send HTTP requests without starting a real server:

```typescript
import request from 'supertest';
import './setup';
import { app } from '../index';

// One-off request — no session state
const response = await request(app)
  .post('/api/auth/login')
  .send({ email: 'test@example.com', password: 'correct-password' });

expect(response.status).toBe(200);
```

For tests that need to preserve session cookies across multiple requests, use `request.agent()`:

```typescript
// agent maintains cookies between requests
const agent = request.agent(app);

// Login — session cookie is stored in the agent
await agent
  .post('/api/auth/login')
  .send({ email: 'test@example.com', password: 'correct-password' });

// Subsequent requests include the session cookie automatically
const response = await agent.get('/api/me');
expect(response.status).toBe(200);
```

## Using the Helpers

`helpers.ts` provides thin wrappers around Supertest for common patterns:

```typescript
import { get, post, expectJson, expectStatus } from './helpers';

// GET request
const response = await get(app, '/healthz');

// POST request with body
const response = await post(app, '/api/auth/login', {
  email: 'test@example.com',
  password: 'correct-password',
});

// Assertions
expectStatus(response, 200);           // expect(response.status).toBe(200)
expectJson(response);                  // checks content-type: application/json
```

`createAuthenticatedAgent(app)` returns a `request.agent(app)` — the same as calling `request.agent(app)` directly, but named for clarity in test code.

## Testing Health Endpoints

The health endpoints have no dependencies on the database mock configuration — they work as-is:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import './setup';
import { app } from '../index';
import { AppDataSource } from '../data-source';

describe('GET /healthz', () => {
  it('returns 200 with status, timestamp, and version', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
  });

  it('returns a valid ISO timestamp', async () => {
    const response = await request(app).get('/healthz');
    const timestamp = response.body.timestamp;
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});
```

`/readyz` checks database connectivity. The mock defaults to a passing `query`, but you can override it to test the failure path:

```typescript
describe('GET /readyz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ready when database responds', async () => {
    vi.mocked(AppDataSource.query).mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(app).get('/readyz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready'); // not 'ok'
    expect(response.body).toHaveProperty('timestamp');
  });

  it('returns 503 when database query fails', async () => {
    vi.mocked(AppDataSource.query).mockRejectedValue(new Error('Connection failed'));

    const response = await request(app).get('/readyz');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not ready');
    expect(response.body.error).toBeDefined();
  });
});
```

## Testing Authentication Endpoints

### Registration

The register endpoint validates input, checks for duplicate emails, and creates a user. Tests cover all three paths:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import { app } from '../index';
import { AppDataSource } from '../data-source';
import { testUser } from './fixtures/users';

describe('POST /api/auth/register', () => {
  it('creates a user with valid data', async () => {
    const mockRepo = {
      findOne: vi.fn().mockResolvedValue(null), // no existing user
      create: vi.fn().mockReturnValue({ id: 'new-id', email: 'new@example.com', name: 'New', role: 'SE' }),
      save: vi.fn().mockResolvedValue({ id: 'new-id', email: 'new@example.com', name: 'New', role: 'SE' }),
    };
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', name: 'New', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('new@example.com');
  });

  it('returns 409 when email already exists', async () => {
    const mockRepo = {
      findOne: vi.fn().mockResolvedValue(testUser), // existing user
    };
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', name: 'Test', password: 'password123' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('ALREADY_EXISTS');
    expect(response.body.message).toContain('already exists');
  });

  it('returns 400 when name is missing', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    expect(response.body.details?.name).toContain('Name');
  });

  it('returns 400 when password is under 8 characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', name: 'Test', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    expect(response.body.details?.password).toContain('8 characters');
  });
});
```

### Login

The login endpoint checks credentials against the database. The bcrypt mock makes this predictable: `password: 'correct-password'` always passes; anything else fails.

```typescript
describe('POST /api/auth/login', () => {
  it('returns 200 and sets session with valid credentials', async () => {
    const mockRepo = {
      findOne: vi.fn().mockResolvedValue(testUser),
    };
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toBeDefined();
  });

  it('returns 401 when user does not exist', async () => {
    const mockRepo = {
      findOne: vi.fn().mockResolvedValue(null), // user not found
    };
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('INVALID_CREDENTIALS');
    expect(response.body.message).toContain('Invalid');
  });

  it('returns 401 for OAuth users without a password', async () => {
    // testUserWithoutPassword has no passwordHash — can't log in with a password
    const mockRepo = {
      findOne: vi.fn().mockResolvedValue(testUserWithoutPassword),
    };
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nopassword@example.com', password: 'password123' });

    expect(response.status).toBe(401);
  });
});
```

The `testUserWithoutPassword` fixture represents a user created through an OAuth flow — no password was ever set, so password login should fail even if the user account exists.

## Testing Protected Routes

Routes guarded by `requireAuth` require an active session. Use `request.agent()` to persist the session cookie set during login:

```typescript
describe('GET /api/me', () => {
  it('returns 401 without a session', async () => {
    // Plain request(app) has no session
    const response = await request(app).get('/api/me');
    expect(response.status).toBe(401);
  });

  it('returns user data when authenticated', async () => {
    const mockRepo = {
      findOne: vi.fn().mockResolvedValue(testUser),
    };
    vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

    // agent persists cookies between requests
    const agent = request.agent(app);

    // Log in — session cookie is stored in the agent
    await agent
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .expect(200);

    // The session cookie is automatically sent with this request
    const response = await agent.get('/api/me').expect(200);
    expect(response.body).toBeDefined();
  });
});
```

## Error Response Format

Every error from the API follows the same shape. Integration tests can verify this consistency:

```typescript
it('returns a consistent error format for unknown routes', async () => {
  const response = await request(app).get('/api/does-not-exist');

  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('error');    // error code string
  expect(response.body).toHaveProperty('message');  // human-readable message
  expect(response.body).toHaveProperty('statusCode');
});
```

## Running Integration Tests

```bash
# All API tests
./dev.sh test:api

# Specific test file
./dev.sh test:file apps/api/src/tests/auth.test.ts
./dev.sh test:file apps/api/src/tests/health.test.ts

# Watch mode — reruns on file changes
./dev.sh test:watch
```

## Next Steps

- **[Unit Tests](/dashboard/docs/testing/unit-tests)** — Component and hook testing patterns
- **[Overview](/dashboard/docs/testing/overview)** — Test infrastructure, configuration, and running tests
- **[API Routes](/dashboard/docs/backend/api-routes)** — The endpoints being tested
