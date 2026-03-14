import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getAllowedOrigins', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default localhost origin when no env vars set', async () => {
    delete process.env.WEB_URL;
    delete process.env.CORS_ORIGINS;
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('http://localhost:3000');
  });

  it('should include WEB_URL when set', async () => {
    process.env.WEB_URL = 'https://myapp.example.com';
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';
    delete process.env.CORS_ORIGINS;

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('https://myapp.example.com');
  });

  it('should parse CORS_ORIGINS env variable correctly', async () => {
    process.env.WEB_URL = 'http://localhost:3000';
    process.env.CORS_ORIGINS = 'https://example.com';
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('https://example.com');
  });

  it('should handle comma-separated CORS_ORIGINS', async () => {
    process.env.WEB_URL = 'http://localhost:3000';
    process.env.CORS_ORIGINS = 'https://example.com, https://other.com, https://third.com';
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('https://example.com');
    expect(origins).toContain('https://other.com');
    expect(origins).toContain('https://third.com');
  });

  it('should trim whitespace from comma-separated origins', async () => {
    process.env.WEB_URL = 'http://localhost:3000';
    process.env.CORS_ORIGINS = '  https://example.com  ,  https://other.com  ';
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('https://example.com');
    expect(origins).toContain('https://other.com');
    // Should not contain whitespace-padded versions
    expect(origins).not.toContain('  https://example.com  ');
  });

  it('should include localhost variants in development mode', async () => {
    process.env.WEB_URL = 'http://localhost:3000';
    delete process.env.CORS_ORIGINS;
    process.env.NODE_ENV = 'development';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('http://localhost:3000');
    expect(origins).toContain('http://localhost:3001');
    expect(origins).toContain('http://127.0.0.1:3000');
    expect(origins).toContain('http://127.0.0.1:3001');
  });

  it('should not include localhost variants in production mode', async () => {
    process.env.WEB_URL = 'https://production.com';
    delete process.env.CORS_ORIGINS;
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(origins).toContain('https://production.com');
    expect(origins).not.toContain('http://localhost:3001');
    expect(origins).not.toContain('http://127.0.0.1:3000');
    expect(origins).not.toContain('http://127.0.0.1:3001');
  });

  it('should return array of strings', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'test-secret';

    const { getAllowedOrigins } = await import('../utils/cors');
    const origins = getAllowedOrigins();

    expect(Array.isArray(origins)).toBe(true);
    origins.forEach((origin) => {
      expect(typeof origin).toBe('string');
    });
  });
});

