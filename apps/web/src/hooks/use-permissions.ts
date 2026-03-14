/**
 * usePermissions Hook - Role-Based Access Control for the frontend
 *
 * Usage:
 *   const { hasRole, isAdmin, user, isLoading } = usePermissions();
 *
 *   if (hasRole('admin')) { ... }
 *   if (isAdmin) { ... }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole } from '@agent-irc/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface UsePermissionsResult {
  /** Current user, null if not logged in */
  user: User | null;
  /** Whether user data is still loading */
  isLoading: boolean;
  /** Whether there was an error fetching user data */
  error: Error | null;
  /** Check if user has a specific role */
  hasRole: (role: UserRole | UserRole[]) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: UserRole[]) => boolean;
  /** Convenience: true if user is admin */
  isAdmin: boolean;
  /** Re-fetch user data */
  refetch: () => Promise<void>;
}

/**
 * Hook for accessing current user and checking permissions.
 * Fetches user data from the API and provides role-checking utilities.
 */
export function usePermissions(): UsePermissionsResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        // Not authenticated - that's okay, user is just not logged in
        setUser(null);
      } else {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Check if user has a specific role or one of multiple roles
   */
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;

      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role as UserRole);
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    },
    [user]
  );

  /**
   * Convenience check for admin role
   */
  const isAdmin = useMemo(() => {
    return user?.role === UserRole.ADMIN;
  }, [user]);

  return {
    user,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    isAdmin,
    refetch: fetchUser,
  };
}

