# Testing Overview

<!-- AI_CONTEXT
This document provides an overview of the testing infrastructure.
Key files: apps/api/vitest.config.ts, apps/web/vitest.config.ts, apps/web/vitest.setup.ts
Framework: Vitest
API tests: apps/api/src/tests/ (setup.ts, helpers.ts, fixtures/users.ts, auth.test.ts, health.test.ts)
Web tests: apps/web/src/components/__tests__/, hooks/__tests__/, app/__tests__/, lib/__tests__/
Web tests import directly from @testing-library/react — no custom test-utils file.
API vitest.config uses unplugin-swc plugin for TypeScript decorator support (required for TypeORM).
Web vitest.config uses @vitejs/plugin-react, jsdom environment, vitest.setup.ts for global mocks.
vitest.setup.ts sets up: @testing-library/jest-dom, window.matchMedia, IntersectionObserver, ResizeObserver, scrollTo, scrollIntoView mocks.
Related docs: unit-tests, integration-tests, getting-started/dev-commands
-->

## Why Tests Matter

Tests are code that checks your other code. You run them, and if something is broken, a test fails and tells you exactly what broke and where. The alternative is finding broken things in production — after your users encounter them.

For a starter template specifically, tests serve a second purpose: they document how the code is supposed to behave. Reading a test tells you what a function does in plain terms, even if you've never seen the implementation.

App Shell ships with tests for both the frontend and backend. They're not exhaustive, but they cover the critical paths — authentication flows, middleware behavior, component rendering — and demonstrate the patterns you should follow when you add your own.

## Testing Stack

| Tool | What It Does |
|------|-------------|
| **Vitest** | Runs tests, provides assertions (`expect`, `describe`, `it`). Fast, TypeScript-native, similar API to Jest. |
| **@testing-library/react** | Renders React components in tests and provides utilities to query and interact with the rendered output. |
| **@testing-library/jest-dom** | Adds DOM-specific matchers like `toBeInTheDocument()` and `toBeDisabled()`. |
| **Supertest** | Makes HTTP requests to an Express app in tests without starting an actual server. |
| **jsdom** | A JavaScript implementation of a browser environment, used to run component tests in Node. |

## Test File Locations

```
apps/api/src/tests/
├── setup.ts           # Mocks database, bcrypt, logger, pino-http
├── helpers.ts         # Utilities: get(), post(), expectJson(), expectStatus()
├── fixtures/
│   └── users.ts       # Test user objects and factory functions
├── health.test.ts
└── auth.test.ts

apps/web/src/
├── components/__tests__/    # Component tests (Button, Breadcrumbs, etc.)
│   └── ui/__tests__/        # UI component tests
├── hooks/__tests__/         # Hook tests (use-api, use-pagination, etc.)
├── app/__tests__/           # Page tests (login, dashboard)
└── lib/__tests__/           # Utility tests

packages/shared/src/
└── **/*.test.ts             # Schema and type tests
```

## Running Tests

```bash
# Run all tests once
./dev.sh test

# Run in watch mode — reruns when files change
./dev.sh test:watch

# Run only API tests
./dev.sh test:api

# Run only frontend tests
./dev.sh test:web

# Run only shared package tests
./dev.sh test:shared

# Generate coverage reports
./dev.sh test:coverage

# Run a single file
./dev.sh test:file apps/api/src/tests/auth.test.ts
./dev.sh test:file apps/web/src/hooks/__tests__/use-pagination.test.ts
```

`test:file` auto-detects which package a file belongs to, so you don't need to specify `--filter`.

## Configuration

### API (`apps/api/vitest.config.ts`)

The API needs special handling for TypeScript decorators, which TypeORM uses to define entities (`@Entity`, `@Column`, etc.). The `unplugin-swc` plugin handles this:

```typescript
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorMetadata: true, legacyDecorator: true },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
});
```

### Web (`apps/web/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',         // Simulated browser environment
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
```

### Global Setup (`apps/web/vitest.setup.ts`)

The setup file runs before every test file. It imports `@testing-library/jest-dom` (to add DOM matchers) and provides browser APIs that jsdom doesn't implement:

```typescript
import '@testing-library/jest-dom';

// Components that check for responsive breakpoints need this
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Radix UI components and others use these observers
Object.defineProperty(window, 'IntersectionObserver', { value: MockIntersectionObserver });
Object.defineProperty(window, 'ResizeObserver', { value: MockResizeObserver });

// Radix Select and cmdk use this
Element.prototype.scrollIntoView = vi.fn();
```

Without these stubs, many component tests would crash because jsdom doesn't implement browser APIs that real browsers have.

## Test Naming and Structure

All tests use the same Vitest API:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature or module name', () => {
  describe('specific behavior', () => {
    beforeEach(() => {
      vi.clearAllMocks(); // Reset between tests
    });

    it('should do the expected thing', () => {
      // Arrange
      const input = 'something';

      // Act
      const result = transform(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

The **Arrange-Act-Assert** pattern keeps tests readable: set up the conditions, do the thing, check the result.

## Coverage

```bash
./dev.sh test:coverage
```

Coverage reports are generated per-package in each package's `coverage/` directory. They show which lines of code were executed during tests and which weren't. A high coverage number doesn't automatically mean good tests — you can have 100% coverage with tests that don't actually assert anything meaningful — but it's a useful signal for spotting completely untested areas.

## Next Steps

- **[Unit Tests](/dashboard/docs/testing/unit-tests)** — Testing hooks, components, and utilities
- **[Integration Tests](/dashboard/docs/testing/integration-tests)** — Testing API endpoints end-to-end
