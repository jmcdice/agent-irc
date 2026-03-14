# Role-Based Access Control

<!-- AI_CONTEXT
This document covers RBAC implementation.
Key files: packages/shared/src/schemas.ts (UserRole), apps/api/src/middleware/auth.ts, apps/web/src/hooks/use-permissions.ts
Roles: user, admin
Related docs: overview, frontend/hooks, backend/middleware
-->

## Overview

App Shell includes Role-Based Access Control (RBAC) for both frontend and backend:

- **Roles defined in shared package** - Consistent across frontend/backend
- **Backend middleware** - Protect API routes by role
- **Frontend hook** - Hide UI elements by role
- **Frontend component** - Conditionally render content

## Roles

Roles are defined in `@app-shell/shared`:

```typescript
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_ROLES: readonly UserRole[] = Object.values(UserRole);
```

## Backend RBAC

### Authentication Middleware

```typescript
// middleware/auth.ts
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    throw ApiError.unauthorized('Authentication required');
  }
  next();
}
```

### Role Middleware

```typescript
// middleware/auth.ts
export function requireRole(role: UserRole | UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.session.userId } });

    const roles = Array.isArray(role) ? role : [role];

    if (!user || !roles.includes(user.role as UserRole)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
}
```

### Usage in Routes

```typescript
import { requireAuth, requireRole } from './middleware/auth';
import { UserRole } from '@app-shell/shared';

// Any authenticated user
app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  // ...
}));

// Admin only
app.get('/api/admin/users',
  requireAuth,
  requireRole(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    // ...
  })
);

// Multiple roles
app.get('/api/reports',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.MANAGER]),
  asyncHandler(async (req, res) => {
    // ...
  })
);
```

## Frontend RBAC

### usePermissions Hook

```typescript
import { usePermissions } from '@/hooks/use-permissions';

function AdminPanel() {
  const { user, isLoading, isAdmin, hasRole } = usePermissions();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>

      {isAdmin && (
        <Button>Admin Settings</Button>
      )}

      {hasRole(UserRole.ADMIN) && (
        <AdminDashboard />
      )}
    </div>
  );
}
```

### Hook API

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `user` | `User \| null` | Current user |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Fetch error |
| `hasRole(role)` | `(UserRole) => boolean` | Check single role |
| `hasAnyRole(roles)` | `(UserRole[]) => boolean` | Check multiple roles |
| `isAdmin` | `boolean` | Convenience for admin check |
| `refetch()` | `() => Promise` | Refresh user data |

### RequireRole Component

Create a reusable component:

```tsx
// components/require-role.tsx
import { usePermissions } from '@/hooks/use-permissions';
import { UserRole } from '@app-shell/shared';

interface RequireRoleProps {
  role: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { hasRole, hasAnyRole, isLoading } = usePermissions();

  if (isLoading) return null;

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = roles.length === 1 ? hasRole(roles[0]) : hasAnyRole(roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

Usage:

```tsx
<RequireRole role={UserRole.ADMIN}>
  <AdminControls />
</RequireRole>

<RequireRole role={[UserRole.ADMIN, UserRole.MANAGER]} fallback={<AccessDenied />}>
  <ManagementDashboard />
</RequireRole>
```

## Adding New Roles

1. Add to shared package:
   ```typescript
   // packages/shared/src/schemas.ts
   export const UserRole = {
     USER: 'user',
     ADMIN: 'admin',
     MANAGER: 'manager',  // New role
   } as const;
   ```

2. Rebuild shared:
   ```bash
   pnpm --filter @app-shell/shared build
   ```

3. Use in routes and components.

## Best Practices

1. **Always check on backend** - Frontend checks are for UX only
2. **Use middleware** - Don't check roles inside route handlers
3. **Least privilege** - Default to most restrictive role
4. **Audit role changes** - Log when user roles are modified

## Next Steps

- **[Hooks](/dashboard/docs/frontend/hooks)** - usePermissions details
- **[Middleware](/dashboard/docs/backend/middleware)** - Backend auth middleware

