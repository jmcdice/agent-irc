/**
 * Web Test Utilities
 * 
 * Centralized testing utilities for the web app.
 * Import from '@/tests/test-utils' in your tests.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';

// ============================================================================
// Custom Render with Providers
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * All providers that wrap the app
 * Add new providers here as you add them to the app
 */
function AllProviders({ children }: WrapperProps) {
  return (
    <>
      {children}
    </>
  );
}

/**
 * Custom render function that wraps components with all providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Create a mock for next/navigation
 */
export function createRouterMock() {
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();
  const forward = vi.fn();
  const refresh = vi.fn();
  const prefetch = vi.fn();

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
    // Reset all mocks
    reset: () => {
      push.mockClear();
      replace.mockClear();
      back.mockClear();
      forward.mockClear();
      refresh.mockClear();
      prefetch.mockClear();
    },
  };
}

/**
 * Create a mock fetch function with preset responses
 */
export function createFetchMock() {
  const mockFetch = vi.fn();
  
  return {
    mock: mockFetch,
    
    // Success response
    success: (data: unknown = {}) => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(data),
      });
    },
    
    // Error response
    error: (error: string, status = 400) => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status,
        json: () => Promise.resolve({ error }),
      });
    },
    
    // Network error
    networkError: (message = 'Network error') => {
      mockFetch.mockRejectedValueOnce(new Error(message));
    },
    
    // Pending (never resolves - for testing loading states)
    pending: () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}));
    },
    
    // Reset
    reset: () => {
      mockFetch.mockClear();
    },
  };
}

// ============================================================================
// Test Data Helpers
// ============================================================================

/**
 * Create a mock user object
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    avatarUrl: undefined,
    ...overrides,
  };
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

/**
 * Wait for a condition to be true (useful for async tests)
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

