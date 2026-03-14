import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import { app } from '../index';
import { AppDataSource } from '../data-source';

describe('Health Check Endpoint', () => {
  it('should return 200 status code on GET /healthz', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
  });

  it('should return correct content-type', async () => {
    const response = await request(app).get('/healthz');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  it('should return valid ISO timestamp', async () => {
    const response = await request(app).get('/healthz');

    const timestamp = response.body.timestamp;
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});

describe('Readiness Check Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 when database is connected', async () => {
    vi.mocked(AppDataSource.query).mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(app).get('/readyz');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 503 when database query fails', async () => {
    vi.mocked(AppDataSource.query).mockRejectedValue(new Error('Connection failed'));

    const response = await request(app).get('/readyz');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not ready');
    expect(response.body.error).toBeDefined();
  });
});

describe('Version Endpoint', () => {
  it('should return version information', async () => {
    const response = await request(app).get('/api/version');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('buildDate');
    expect(response.body).toHaveProperty('environment');
  });

  it('should return correct content-type', async () => {
    const response = await request(app).get('/api/version');

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});

