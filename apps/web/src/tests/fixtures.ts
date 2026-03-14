/**
 * Web Test Fixtures
 * 
 * Centralized test data for the web app.
 * Import from '@/tests/fixtures' in your tests.
 */

// ============================================================================
// User Fixtures
// ============================================================================

export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  avatarUrl: undefined,
};

export const mockAdmin = {
  id: 'admin-123',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  avatarUrl: 'https://example.com/admin-avatar.jpg',
};

export const mockUserWithAvatar = {
  ...mockUser,
  id: 'user-456',
  avatarUrl: 'https://example.com/avatar.jpg',
};

// ============================================================================
// API Response Fixtures
// ============================================================================

export const mockHealthResponse = {
  status: 'ok' as const,
  timestamp: '2024-01-01T00:00:00.000Z',
  version: '0.1.0',
};

export const mockApiError = {
  error: 'Something went wrong',
  code: 'INTERNAL_ERROR',
  statusCode: 500,
};

export const mockValidationError = {
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  statusCode: 400,
  details: {
    email: 'Email is required',
  },
};

export const mockUnauthorizedError = {
  error: 'Unauthorized',
  code: 'UNAUTHORIZED',
  statusCode: 401,
};

// ============================================================================
// Form Data Fixtures
// ============================================================================

export const validLoginData = {
  email: 'test@example.com',
  password: 'password123',
};

export const validRegisterData = {
  email: 'newuser@example.com',
  name: 'New User',
  password: 'password123',
};

export const invalidFormData = {
  emptyEmail: { email: '', password: 'password123' },
  emptyPassword: { email: 'test@example.com', password: '' },
  shortPassword: { email: 'test@example.com', password: 'short' },
  invalidEmail: { email: 'not-an-email', password: 'password123' },
};

// ============================================================================
// Navigation Fixtures
// ============================================================================

export const mockPathnames = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
  nestedPath: '/a/b/c',
};

// ============================================================================
// Session Fixtures
// ============================================================================

export const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
};

export const expiredSession = {
  id: 'session-expired',
  userId: 'user-123',
  expiresAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
};

