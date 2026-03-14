import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../use-permissions';
import { UserRole } from '@agent-irc/shared';

describe('usePermissions', () => {
  const originalFetch = global.fetch;
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch user on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockUser),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('should handle 401 response (not authenticated)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull(); // 401 is not an error, just not logged in
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  describe('hasRole', () => {
    it('should return true for matching role', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ...mockUser, role: 'admin' }),
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasRole(UserRole.ADMIN)).toBe(true);
      expect(result.current.hasRole(UserRole.USER)).toBe(false);
    });

    it('should accept array of roles', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ...mockUser, role: 'user' }),
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // User has 'user' role, so should match array containing USER
      expect(result.current.hasRole([UserRole.ADMIN, UserRole.USER])).toBe(true);
      // User has 'user' role, so should NOT match array containing only ADMIN
      expect(result.current.hasRole([UserRole.ADMIN])).toBe(false);
    });

    it('should return false when no user', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasRole(UserRole.USER)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ...mockUser, role: 'user' }),
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasAnyRole([UserRole.ADMIN, UserRole.USER])).toBe(true);
      // User has 'user' role, so should NOT match array containing only ADMIN
      expect(result.current.hasAnyRole([UserRole.ADMIN])).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ...mockUser, role: 'admin' }),
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
    });

    it('should return false for non-admin users', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ...mockUser, role: 'user' }),
      });

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });
  });
});

