# Input Validation

<!-- AI_CONTEXT
This document covers input validation patterns.
Key files: packages/shared/src/schemas.ts, apps/api/src/index.ts
Shared schemas: loginSchema, registerSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema
IMPORTANT: The API currently uses manual validation in route handlers, NOT Zod safeParse. Shared schemas are primarily used on the frontend with react-hook-form.
IMPORTANT: Actual password rules in registerSchema are ONLY min 8, max 128 — no uppercase/lowercase/number regex requirements.
IMPORTANT: TypeORM uses parameterized queries by default — raw interpolation is the only SQL injection risk.
No sanitize-html package is installed. String trimming is done manually.
Related docs: backend/api-routes, backend/error-handling, frontend/hooks
-->

## Why Input Validation Matters

Every form your users fill out, every API endpoint your app exposes, every parameter in a URL — all of it is user input. And all of it can contain unexpected, malformed, or malicious data.

Input validation is the practice of checking that data matches what you expect before doing anything with it. This has two purposes:

**User experience:** Showing a clear "email is required" message immediately is better than letting the user submit and waiting for a vague server error.

**Security:** A backend that blindly trusts everything it receives is vulnerable. Someone could send a thousand-character string where you expected a name, skip required fields entirely, or craft inputs designed to manipulate database queries.

The rule: **always validate on the backend**. Frontend validation is for UX — it can always be bypassed. Backend validation is the actual security enforcement.

## Three Layers of Defense

```
Browser         →    API Backend     →    Database
Zod schemas          Manual checks        Constraints
(UX feedback)        (security)           (last resort)
```

**Browser (client-side):** Runs before the request is sent. Gives immediate feedback. Can be bypassed by anyone who knows how to use developer tools or curl. Never trust this alone.

**API backend:** The real enforcement layer. Runs on your server, can't be bypassed. This is where security decisions live.

**Database:** PostgreSQL column constraints (not null, unique, data types) are a last line of defense. TypeORM enforces these before writing. They're not a substitute for application-level validation.

## Shared Schemas

The schemas in `packages/shared/src/schemas.ts` use **Zod** — a TypeScript-native library for describing the shape and rules of data:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});
```

These schemas define exactly what valid data looks like — required fields, format rules, length limits. Because they live in `@app-shell/shared`, both the frontend and backend can import the same schema, guaranteeing they agree on what "valid" means.

## Backend Validation

The API routes use manual validation. The pattern: collect all errors into an object, then throw once at the end so the user gets all the field errors in a single response rather than one at a time:

```typescript
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email address';
  }

  if (!name) {
    errors.name = 'Name is required';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.validationError('Validation failed', errors);
  }

  // Continue with validated data...
}));
```

You can also use the shared Zod schemas directly in route handlers if you prefer:

```typescript
import { registerSchema } from '@app-shell/shared';

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    const details: Record<string, string> = {};
    for (const [field, messages] of Object.entries(fieldErrors)) {
      details[field] = messages?.[0] ?? 'Invalid';
    }
    throw ApiError.validationError('Validation failed', details);
  }

  const { email, name, password } = result.data;
  // result.data is fully typed and validated
}));
```

Either approach works. The manual pattern is more explicit; the Zod pattern reuses the shared rules automatically.

## Frontend Validation

The frontend uses the shared schemas with **react-hook-form** and its Zod resolver. This connects form state directly to the schema — no separate validation logic needed:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@app-shell/shared';

function RegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    // data is already validated by the schema
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Handle server-side validation errors (e.g., email already taken)
    if (result.error?.error === 'VALIDATION_ERROR') {
      Object.entries(result.error.details ?? {}).forEach(([field, message]) => {
        form.setError(field, { message });
      });
    }
  };
}
```

The form validates against the schema before submitting. If the API returns field-level validation errors (for things the client can't check, like email uniqueness), those get applied to the form fields too.

## Sanitization

Beyond type validation, consider trimming and normalizing input where it makes sense:

```typescript
// Trim whitespace from strings — a user shouldn't fail because of a trailing space
const email = req.body.email?.trim().toLowerCase();
const name = req.body.name?.trim();

// Limit lengths as a defense-in-depth measure
// (your schema should enforce this, but belt-and-suspenders is fine)
const name = req.body.name?.slice(0, 100);
```

If your application accepts rich text or HTML content from users — blog posts, comments, descriptions — you'll want an HTML sanitizer to strip out `<script>` tags and other dangerous markup. App Shell doesn't include one since it doesn't have rich text fields, but `sanitize-html` or `dompurify` are common choices if you add that functionality.

## SQL Injection

SQL injection happens when user input is concatenated directly into a SQL query, letting an attacker change the query's meaning.

TypeORM prevents this by default. Whenever you use the standard repository methods or the query builder with named parameters, TypeORM generates parameterized queries — the user's input is sent separately from the query structure and can never change it:

```typescript
// Safe — TypeORM parameterizes automatically
const user = await userRepo.findOne({ where: { email } });

// Safe — named parameter, not interpolation
const user = await userRepo
  .createQueryBuilder('user')
  .where('user.email = :email', { email })
  .getOne();

// UNSAFE — never do this
const user = await userRepo.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

The only SQL injection risk is raw string interpolation inside `repo.query()`. Don't use that pattern. If you need to run raw SQL, use the parameterized form:

```typescript
// Safe raw query
const users = await AppDataSource.query(
  'SELECT * FROM users WHERE role = $1',
  ['admin']
);
```

## Adding Validation to New Routes

When you add a new route, follow this checklist:

1. **Validate required fields** — check for presence before type
2. **Validate formats** — email format, string lengths, numeric ranges
3. **Collect all errors first** — throw one `ApiError.validationError()` with all field errors
4. **Check business rules after** — uniqueness checks, existence checks (these hit the database, so validate first)
5. **Trust `result.data`** — if you used Zod `safeParse`, only work with `result.data`, not the original `req.body`

## Next Steps

- **[Error Handling](/dashboard/docs/backend/error-handling)** — How validation errors become API responses
- **[API Routes](/dashboard/docs/backend/api-routes)** — The full validation pattern in context
