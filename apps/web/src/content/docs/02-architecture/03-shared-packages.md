# Shared Packages

<!-- AI_CONTEXT
This document explains the @app-shell/shared package.
Key files: packages/shared/src/index.ts, packages/shared/src/schemas.ts
UserRole is a const object (not an enum): { USER: 'user', ADMIN: 'admin' }
Exports: User, Session, ApiError, HealthResponse interfaces; UserRole, ALL_ROLES; validation schemas; form types
Schemas use Zod. changePasswordSchema and resetPasswordSchema use .refine() for cross-field validation.
UpdateProfileSchema distinguishes z.input (form values) from z.output (API payload).
FormErrors<T> is a helper type for field-level error maps.
Related docs: monorepo-structure, backend/database, authentication/overview
-->

The `packages/shared` package exists to solve a specific problem: your frontend and backend need to agree on the shape of your data. If the API says it returns a `User` object, both sides should be working from the same definition of what fields a `User` has, what types they are, and what values are valid.

Without a shared package, you'd define the `User` type separately in both places. They'd drift apart. The API would add a field that the frontend doesn't know about, or the frontend would expect a field the API stopped sending. TypeScript would have no way to catch this because it would be checking each codebase in isolation.

With `packages/shared`, there's one definition. Both apps import from it. TypeScript connects them.

## What's in the Package

```
packages/shared/
└── src/
    ├── index.ts      # Type interfaces and re-exports
    └── schemas.ts    # Zod validation schemas and related types
```

## Type Definitions

`index.ts` exports the core TypeScript interfaces:

```typescript
// The shape of a user as returned by the API
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// An active login session
export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
}

// The shape of an API error response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, string>;
}

// The shape of a health check response
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
}
```

These are plain TypeScript interfaces — no runtime behavior, just type information. They're used wherever code needs to know what shape an object has: in API route handlers, in frontend data fetching functions, in tests.

## Roles

User roles are defined as a `const` object rather than a TypeScript enum. The distinction matters if you're working in the code: TypeScript enums generate runtime JavaScript objects with some quirky behaviors, while a `const` object is straightforward and serializes cleanly to strings.

```typescript
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_ROLES: readonly UserRole[] = Object.values(UserRole);
```

In practice you use it like this:

```typescript
import { UserRole, ALL_ROLES } from '@app-shell/shared';

// Check if a user is an admin
if (user.role === UserRole.ADMIN) {
  // admin-only logic
}

// Get all possible roles (useful for dropdowns or validation)
console.log(ALL_ROLES); // ['user', 'admin']
```

## Validation Schemas

`schemas.ts` defines Zod validation schemas for every form and API input in the application. **Zod** is a library that lets you describe the exact shape and rules for a piece of data, then validate real data against that description at runtime.

The power of having schemas in the shared package is that the same rules run in two places: the frontend validates form inputs before submission, and the backend validates the incoming request body. Both use the same schema, so the rules are guaranteed to be consistent.

### Authentication schemas

```typescript
import { loginSchema, registerSchema } from '@app-shell/shared';

// loginSchema requires:
// - email: valid email address, non-empty
// - password: non-empty string

// registerSchema requires:
// - email: valid email address, non-empty
// - name: 1–100 characters (whitespace trimmed automatically)
// - password: 8–128 characters
```

### Password management schemas

`changePasswordSchema` and `resetPasswordSchema` both use a cross-field validation rule: the new password and the confirmation must match. This is declared with Zod's `.refine()` method, which lets you express validation logic that spans multiple fields.

```typescript
// changePasswordSchema validates:
// - currentPassword: non-empty
// - newPassword: 8–128 characters
// - confirmPassword: must match newPassword (cross-field check)

// resetPasswordSchema validates:
// - token: non-empty
// - password: 8–128 characters
// - confirmPassword: must match password
```

If the passwords don't match, the error is attached specifically to the `confirmPassword` field, which lets the form display it in the right place.

### Profile schema

`updateProfileSchema` has a subtle distinction worth knowing about:

```typescript
import type { UpdateProfileFormValues, UpdateProfileInput } from '@app-shell/shared';
```

`UpdateProfileFormValues` is the type of what the form fields hold — including empty strings for optional fields. `UpdateProfileInput` is what you get after Zod validates and transforms the data — what you'd actually send to the API. Zod's `z.input` and `z.output` types capture this before/after transformation distinction, which matters when `avatarUrl` needs to be coerced from an empty string to `undefined`.

### All schemas at a glance

| Schema | Purpose | Key rules |
|--------|---------|-----------|
| `loginSchema` | Login form | email format, non-empty password |
| `registerSchema` | Registration | email format, name 1–100 chars (trimmed), password 8–128 |
| `changePasswordSchema` | Change password | current + new + confirm, passwords must match |
| `forgotPasswordSchema` | Request reset | email format |
| `resetPasswordSchema` | Complete reset | token + password + confirm, passwords must match |
| `updateProfileSchema` | Profile update | name 1–100 chars, optional avatarUrl |

### Using schemas on the frontend with react-hook-form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@app-shell/shared';

const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema)
});
```

The `zodResolver` adapter connects a Zod schema to react-hook-form, so form validation and type inference are both driven by the same schema definition.

### Using schemas on the backend

```typescript
import { registerSchema } from '@app-shell/shared';

app.post('/api/auth/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    // result.error contains structured field-level errors
    return res.status(400).json({ errors: result.error.flatten() });
  }
  // result.data is fully typed and validated
  const { email, name, password } = result.data;
});
```

Note: the actual API currently does manual validation rather than using these schemas, but the schemas are available for use and the frontend already uses them.

## The FormErrors Helper

```typescript
export type FormErrors<T> = {
  [K in keyof T]?: string;
};
```

`FormErrors<T>` is a utility type for representing field-level validation error messages. Given a type like `LoginInput`, `FormErrors<LoginInput>` produces `{ email?: string; password?: string }` — a map from field names to optional error strings. Useful when handling API error responses and mapping them back to form fields.

## Adding Shared Code

When you add something to `packages/shared`, it's immediately available to both apps through workspace linking. The general pattern:

1. Add your type, schema, or utility to the relevant file in `packages/shared/src/`
2. Export it from `packages/shared/src/index.ts`
3. Run `pnpm --filter @app-shell/shared build` to compile the TypeScript

The compiled output in `packages/shared/dist/` is what the other packages actually import. Both apps reference it via the workspace link, so you don't need to publish anything.

> **Keep shared code truly shared.** If something is only used by the frontend or only by the backend, it doesn't belong here. The shared package should contain things where having a single definition prevents bugs — primarily types that describe API request/response shapes, and validation rules that need to match on both ends.
