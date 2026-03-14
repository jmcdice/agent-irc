import { describe, it, expect } from 'vitest';
import type { HealthResponse, ApiError, User, Session } from '../index';

/**
 * Tests for shared types and utilities
 *
 * These tests verify that the shared types are correctly structured
 * and can be used as expected across the monorepo.
 */

describe('Shared Types', () => {
  describe('HealthResponse', () => {
    it('should accept valid health response with ok status', () => {
      const response: HealthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };

      expect(response.status).toBe('ok');
      expect(response.timestamp).toBeDefined();
      expect(response.version).toBe('1.0.0');
    });

    it('should accept valid health response with error status', () => {
      const response: HealthResponse = {
        status: 'error',
        timestamp: new Date().toISOString(),
      };

      expect(response.status).toBe('error');
      expect(response.version).toBeUndefined();
    });

    it('should allow version to be optional', () => {
      const response: HealthResponse = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      expect(response.version).toBeUndefined();
    });
  });

  describe('ApiError', () => {
    it('should accept valid API error structure', () => {
      const error: ApiError = {
        error: 'VALIDATION_ERROR',
        message: 'Email is required',
        statusCode: 400,
      };

      expect(error.error).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Email is required');
      expect(error.statusCode).toBe(400);
    });

    it('should represent common HTTP error codes', () => {
      const errors: ApiError[] = [
        { error: 'BAD_REQUEST', message: 'Invalid input', statusCode: 400 },
        { error: 'UNAUTHORIZED', message: 'Not authenticated', statusCode: 401 },
        { error: 'FORBIDDEN', message: 'Access denied', statusCode: 403 },
        { error: 'NOT_FOUND', message: 'Resource not found', statusCode: 404 },
        { error: 'INTERNAL_ERROR', message: 'Server error', statusCode: 500 },
      ];

      expect(errors).toHaveLength(5);
      errors.forEach((err) => {
        expect(err.error).toBeDefined();
        expect(err.message).toBeDefined();
        expect(err.statusCode).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe('User', () => {
    it('should accept valid user structure', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(user.id).toBeDefined();
      expect(user.email).toContain('@');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('user');
    });

    it('should allow avatarUrl to be optional', () => {
      const userWithAvatar: User = {
        id: '123',
        email: 'user@example.com',
        name: 'User',
        role: 'admin',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const userWithoutAvatar: User = {
        id: '456',
        email: 'other@example.com',
        name: 'Other',
        role: 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(userWithAvatar.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(userWithoutAvatar.avatarUrl).toBeUndefined();
    });
  });

  describe('Session', () => {
    it('should accept valid session structure', () => {
      const session: Session = {
        id: 'session-123',
        userId: 'user-456',
        expiresAt: '2024-12-31T23:59:59.000Z',
      };

      expect(session.id).toBeDefined();
      expect(session.userId).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });

    it('should link session to user via userId', () => {
      const userId = 'user-123';
      const session: Session = {
        id: 'session-abc',
        userId,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };

      expect(session.userId).toBe(userId);
    });
  });
});

