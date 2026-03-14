'use client';

/**
 * RequireRole Component - Role-Based Conditional Rendering
 *
 * Usage:
 *   // Show content only to admins
 *   <RequireRole role="admin">
 *     <AdminPanel />
 *   </RequireRole>
 *
 *   // Show content to multiple roles
 *   <RequireRole role={['admin', 'manager']}>
 *     <ManagementTools />
 *   </RequireRole>
 *
 *   // With custom fallback
 *   <RequireRole role="admin" fallback={<p>Access denied</p>}>
 *     <AdminPanel />
 *   </RequireRole>
 */

import { ReactNode } from 'react';
import { UserRole } from '@agent-irc/shared';
import { usePermissions } from '@/hooks/use-permissions';

export interface RequireRoleProps {
  /** Role(s) required to view the children */
  role: UserRole | UserRole[];
  /** Content to show when user has the required role */
  children: ReactNode;
  /** Content to show when user doesn't have the required role (default: null) */
  fallback?: ReactNode;
  /** Content to show while loading user data (default: null) */
  loading?: ReactNode;
}

/**
 * Conditionally renders children based on user role.
 * Hides content from users who don't have the required role(s).
 */
export function RequireRole({
  role,
  children,
  fallback = null,
  loading = null,
}: RequireRoleProps) {
  const { hasRole, isLoading } = usePermissions();

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Convenience component for admin-only content
 */
export function AdminOnly({
  children,
  fallback,
  loading,
}: Omit<RequireRoleProps, 'role'>) {
  return (
    <RequireRole role={UserRole.ADMIN} fallback={fallback} loading={loading}>
      {children}
    </RequireRole>
  );
}

