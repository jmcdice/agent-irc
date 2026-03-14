import { vi } from 'vitest';

// Mock the database connection for integration tests
// This allows us to test endpoints without a real database
vi.mock('../data-source', () => ({
  AppDataSource: {
    initialize: vi.fn().mockResolvedValue(undefined),
    isInitialized: true,
    query: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    getRepository: vi.fn().mockReturnValue({
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ id: 'mock-uuid', ...data })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      delete: vi.fn(),
    }),
  },
}));

// Mock bcrypt for faster tests
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockImplementation((plain, hash) => {
      // Simple mock: if hash starts with 'hashed-', assume valid
      return Promise.resolve(hash === 'hashed-password' || plain === 'correct-password');
    }),
  },
}));

// Suppress pino logging during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// Mock pino-http
vi.mock('pino-http', () => ({
  default: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

export const mockUserRepository = {
  findOne: vi.fn(),
  find: vi.fn(),
  create: vi.fn((data: Record<string, unknown>) => ({ id: 'mock-uuid', createdAt: new Date(), updatedAt: new Date(), ...data })),
  save: vi.fn((entity: Record<string, unknown>) => Promise.resolve(entity)),
  delete: vi.fn(),
};

export function resetMocks() {
  vi.clearAllMocks();
}

