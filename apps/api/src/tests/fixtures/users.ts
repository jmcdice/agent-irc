/**
 * User fixtures for testing
 *
 * These fixtures provide consistent test data across all tests.
 * Use these to avoid duplicating user data in individual tests.
 *
 * Naming convention:
 * - testUser*: Complete user objects (as stored in DB)
 * - *Data: Partial data for API requests
 * - create*: Factory functions for custom fixtures
 */

// ============================================================================
// Complete User Objects (as stored in DB)
// ============================================================================

export const testUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed-password',
  role: 'user',
  avatarUrl: null as string | null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testAdmin = {
  id: 'admin-123',
  email: 'admin@example.com',
  name: 'Admin User',
  passwordHash: 'hashed-password',
  role: 'admin',
  avatarUrl: 'https://example.com/admin-avatar.jpg' as string | null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testUserWithoutPassword = {
  id: 'user-456',
  email: 'nopassword@example.com',
  name: 'No Password User',
  passwordHash: null,
  role: 'user',
  avatarUrl: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testUserWithAvatar = {
  id: 'user-789',
  email: 'avatar@example.com',
  name: 'Avatar User',
  passwordHash: 'hashed-password',
  role: 'user',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ============================================================================
// Request Data (for API requests)
// ============================================================================

export const newUserData = {
  email: 'newuser@example.com',
  name: 'New User',
  password: 'password123',
};

export const existingUserData = {
  email: 'test@example.com',
  password: 'correct-password',
};

export const invalidUserData = {
  shortPassword: { email: 'test@example.com', name: 'Test', password: 'short' },
  missingEmail: { name: 'Test', password: 'password123' },
  missingName: { email: 'test@example.com', password: 'password123' },
  missingPassword: { email: 'test@example.com', name: 'Test' },
  invalidEmail: { email: 'not-an-email', name: 'Test', password: 'password123' },
};

// ============================================================================
// Factory Functions (for custom fixtures)
// ============================================================================

let userIdCounter = 1000;

export function createTestUser(overrides: Partial<typeof testUser> = {}) {
  const id = `user-${userIdCounter++}`;
  return {
    id,
    email: `user-${id}@example.com`,
    name: 'Test User',
    passwordHash: 'hashed-password',
    role: 'user',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestAdmin(overrides: Partial<typeof testAdmin> = {}) {
  return createTestUser({ role: 'admin', ...overrides });
}

/**
 * Reset the user ID counter (call in beforeEach if needed)
 */
export function resetUserIdCounter() {
  userIdCounter = 1000;
}

