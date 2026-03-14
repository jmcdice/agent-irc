import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import './setup';
import { app } from '../index';
import { AppDataSource } from '../data-source';
import { testUser, testUserWithoutPassword } from './fixtures/users';

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const mockRepo = {
        findOne: vi.fn().mockResolvedValue(null),
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

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details?.name).toContain('Name');
    });

    it('should return 400 when password is less than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: 'Test', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details?.password).toContain('8 characters');
    });

    it('should return 409 when email already exists', async () => {
      const mockRepo = {
        findOne: vi.fn().mockResolvedValue(testUser),
      };
      vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: 'Test', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('ALREADY_EXISTS');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
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

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      const mockRepo = {
        findOne: vi.fn().mockResolvedValue(null),
      };
      vi.mocked(AppDataSource.getRepository).mockReturnValue(mockRepo as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 for user without password hash', async () => {
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
});

