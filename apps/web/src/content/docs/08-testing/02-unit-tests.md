# Unit Tests

<!-- AI_CONTEXT
This document covers unit testing patterns for frontend and backend.
Web test files import directly from @testing-library/react — no custom test-utils wrapper file.
Frontend component tests: render, screen, fireEvent from @testing-library/react.
Hook tests: renderHook, act from @testing-library/react.
usePagination API: setPage() not goToPage(). Also: nextPage(), previousPage(), firstPage(), lastPage().
Backend unit tests test individual utilities (ApiError class, helper functions) in isolation.
The ApiError test pattern: test statusCode, code, message, details fields.
next/navigation mock: vi.mock('next/navigation', ...) with useRouter, usePathname, useSearchParams.
Key files: apps/web/src/components/ui/__tests__/button.test.tsx, hooks/__tests__/use-pagination.test.ts, apps/api/src/tests/setup.ts
Related docs: overview, integration-tests
-->

## What Unit Tests Cover

A unit test checks a single piece of code in isolation — one function, one component, one hook. Everything that piece depends on (databases, network requests, other modules) gets replaced with a controlled fake called a **mock**.

The benefit: you know exactly what you're testing. If the test fails, the problem is in that specific unit, not somewhere in its dependencies.

Unit tests are fast because they don't hit real databases or networks. You can run hundreds in a few seconds.

## Frontend: Testing Components

Component tests use `@testing-library/react`, which renders components into a simulated DOM (jsdom) and provides utilities to find and interact with elements the way a user would.

The guiding principle of Testing Library: **query by what the user sees**, not by implementation details. Use roles, labels, and text rather than CSS classes or component names.

### Basic Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button').className).toContain('bg-destructive');
  });
});
```

### Querying the DOM

Testing Library provides multiple query methods. The right one depends on what you're testing:

| Query | Use When |
|-------|---------|
| `getByRole('button', { name: '...' })` | Most elements — roles are semantic and accessible |
| `getByText('Submit')` | Static text content |
| `getByLabelText('Email')` | Form inputs (finds by their label) |
| `getByPlaceholderText('...@example.com')` | Form inputs without labels |
| `queryByText('...')` | When you expect the element might not be there (`null` if absent) |
| `findByText('...')` | When the element appears asynchronously (returns a Promise) |

Prefer `getByRole` — it encourages accessible markup and fails if the element doesn't have the right semantic role.

### Testing Async Rendering

For components that load data and update:

```typescript
import { render, screen, waitFor } from '@testing-library/react';

it('shows loaded content', async () => {
  render(<UserProfile />);

  // While loading
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for async state update
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

### Mocking Next.js Navigation

Components that use `useRouter`, `usePathname`, or `useSearchParams` need those mocked:

```typescript
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));
```

Put this at the top of the test file. The mock applies to the entire file.

## Frontend: Testing Hooks

Hooks can't be called directly — they must run inside a React component. `renderHook` wraps a hook in a minimal component so you can test it:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/use-pagination';

describe('usePagination', () => {
  it('initializes at page 1 with correct totals', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(10);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('jumps to a specific page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.setPage(7);
    });

    expect(result.current.currentPage).toBe(7);
  });

  it('clamps page to valid range', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => result.current.setPage(999));
    expect(result.current.currentPage).toBe(10); // clamped to max

    act(() => result.current.setPage(-5));
    expect(result.current.currentPage).toBe(1); // clamped to min
  });
});
```

`act()` wraps any code that causes state changes. Without it, Vitest will warn that state updates happened outside of test control.

### Testing Hooks That Make API Calls

Hooks that fetch data need `global.fetch` mocked:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiMutation } from '@/hooks/use-api';

describe('useApiMutation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch; // Restore after each test
  });

  it('executes mutation and returns data', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1 }),
    });

    const { result } = renderHook(() => useApiMutation('/api/test', 'POST'));

    await act(async () => {
      await result.current.execute({ name: 'test' });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
      expect(result.current.error).toBeNull();
    });
  });

  it('captures API errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: 'BAD_REQUEST',
        message: 'Invalid data',
      }),
    });

    const { result } = renderHook(() => useApiMutation('/api/test', 'POST'));

    await act(async () => {
      await result.current.execute({});
    });

    expect(result.current.error?.error).toBe('BAD_REQUEST');
    expect(result.current.data).toBeNull();
  });
});
```

## Backend: Testing Utilities

Backend unit tests cover individual classes and functions without involving HTTP or the database.

### Testing ApiError

```typescript
import { describe, it, expect } from 'vitest';
import { ApiError } from '../utils/errors';

describe('ApiError', () => {
  it('creates a 400 bad request error', () => {
    const error = ApiError.badRequest('Invalid format');

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Invalid format');
  });

  it('creates a validation error with field details', () => {
    const error = ApiError.validationError('Validation failed', {
      email: 'Email is required',
      password: 'Too short',
    });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual({
      email: 'Email is required',
      password: 'Too short',
    });
  });

  it('creates a 404 not found error', () => {
    const error = ApiError.notFound('User');

    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('User');
  });

  it('serializes to JSON correctly', () => {
    const error = ApiError.unauthorized();
    const json = error.toJSON();

    expect(json).toHaveProperty('error', 'UNAUTHORIZED');
    expect(json).toHaveProperty('statusCode', 401);
    expect(json).not.toHaveProperty('stack'); // Stack traces don't belong in responses
  });
});
```

### Testing Pure Functions

For functions that take input and return output, unit tests are straightforward:

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils'; // Tailwind class merger utility

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });

  it('resolves Tailwind conflicts', () => {
    // cn uses tailwind-merge, so conflicting utilities resolve correctly
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });
});
```

## Test Fixtures

Fixtures are pre-built test objects you can reuse across tests. For the backend, they live in `apps/api/src/tests/fixtures/users.ts`:

```typescript
// Ready-made user objects
import {
  testUser,        // Standard user with password
  testAdmin,       // User with admin role
  testUserWithoutPassword, // User with no passwordHash (OAuth scenario)
} from './fixtures/users';

// Request data objects
import { newUserData, existingUserData, invalidUserData } from './fixtures/users';

// Factory functions for custom variations
import { createTestUser, createTestAdmin } from './fixtures/users';

// Create a custom user
const customUser = createTestUser({ name: 'Custom Name', role: 'admin' });
```

Factory functions are useful when you need many slightly different users without duplicating the whole object.

## Best Practices

**Test behavior, not implementation.** Test what a component shows and what happens when you interact with it — not which internal functions it calls or what state variables it uses. Implementation can change without breaking behavior.

**One logical assertion per test.** Each `it()` block should verify one thing. Multiple assertions in one test make it harder to understand what failed.

**Write descriptive names.** `it('returns 401 when session cookie is missing')` is more useful than `it('auth works')`.

**Cover the unhappy paths.** Testing that things work when everything is fine is the easy part. Test what happens when inputs are empty, when the network fails, when a user doesn't have permission. That's where bugs live.

**Clear mocks between tests.** `vi.clearAllMocks()` in `beforeEach` prevents test state from leaking. The vitest config sets `clearMocks: true` globally, but being explicit in `beforeEach` is clearer.

## Next Steps

- **[Integration Tests](/dashboard/docs/testing/integration-tests)** — Testing full API endpoint flows
- **[Overview](/dashboard/docs/testing/overview)** — Test infrastructure and running tests
