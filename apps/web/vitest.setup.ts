import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ============================================================================
// Global Mocks
// ============================================================================

// Mock window.matchMedia (needed for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (needed for lazy loading, infinite scroll, etc.)
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver (needed for responsive components)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock scrollTo (needed for scroll-to-top, etc.)
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock scrollIntoView (needed for cmdk, Radix Select, etc. - not supported in JSDOM)
Element.prototype.scrollIntoView = vi.fn();

// ============================================================================
// Console Suppression (optional - uncomment to suppress specific warnings)
// ============================================================================

// Suppress specific console warnings during tests
// const originalWarn = console.warn;
// console.warn = (...args) => {
//   if (args[0]?.includes?.('specific warning to suppress')) return;
//   originalWarn(...args);
// };

