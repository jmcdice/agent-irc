# Error Handling

<!-- AI_CONTEXT
This document covers the standardized error handling system.
Key files: apps/api/src/utils/errors.ts, apps/api/src/middleware/errorHandler.ts
Classes: ApiError (extends Error), ErrorCodes (const object, not enum)
ApiError has: statusCode, code, details, Error.captureStackTrace for clean stack traces
Factory methods: badRequest, validationError, unauthorized, invalidCredentials, forbidden, notFound, conflict, alreadyExists, internal
errorHandler: ApiError logged as warn, unknown errors logged as error with full stack.
In non-production: err.message shown. In production: generic message.
Frontend uses ErrorResponse type from @app-shell/shared.
Related docs: middleware, api-routes
-->

## The Problem Error Handling Solves

When something goes wrong in a route handler — invalid input, missing record, failed database query — the API needs to respond consistently. Without a deliberate system, every developer invents their own format:

```json
{ "message": "not found" }           // from one route
{ "error": true, "msg": "Not Found" } // from another
{ "status": 404, "reason": "..." }    // from a third
```

The frontend can't reliably handle errors if the shape keeps changing. And if an unexpected error leaks a full stack trace into the response, you've just handed potential attackers a map of your code.

App Shell solves this with a single `ApiError` class and a central error handler middleware. All errors flow through one place, get logged consistently, and return the same JSON structure.

## The Error Response Format

Every error from the API looks like this:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "statusCode": 400,
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

- **`error`** — A machine-readable code (always uppercase with underscores). The frontend uses this to determine how to handle the error.
- **`message`** — A human-readable explanation.
- **`statusCode`** — The HTTP status code, also present in the response body for convenience.
- **`details`** — Present for validation errors. Maps field names to their specific error messages. The frontend uses this to display errors next to the right form inputs.

## The ApiError Class

`ApiError` extends JavaScript's built-in `Error` class. The constructor captures a clean stack trace so errors point to where they were created, not to the internals of Express:

```typescript
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string>;

  constructor(message: string, statusCode: number, code: string, details?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
```

You rarely use the constructor directly. Factory methods cover the common cases:

```typescript
// 400 — Bad input
throw ApiError.badRequest('Invalid request format');
throw ApiError.validationError('Validation failed', {
  email: 'Email is required',
  password: 'Must be at least 8 characters',
});

// 401 — Not authenticated
throw ApiError.unauthorized();
throw ApiError.invalidCredentials(); // Used specifically for wrong email/password

// 403 — Authenticated but not allowed
throw ApiError.forbidden();

// 404 — Resource doesn't exist
throw ApiError.notFound('User'); // Produces: "User not found"

// 409 — Conflict with current state
throw ApiError.conflict('Cannot delete an account with active subscriptions');
throw ApiError.alreadyExists('Email'); // Produces: "Email already exists"

// 500 — Unexpected server error
throw ApiError.internal();
```

## Error Codes Reference

```typescript
export const ErrorCodes = {
  BAD_REQUEST:         'BAD_REQUEST',         // 400
  VALIDATION_ERROR:    'VALIDATION_ERROR',     // 400
  UNAUTHORIZED:        'UNAUTHORIZED',         // 401
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS', // 401
  FORBIDDEN:           'FORBIDDEN',            // 403
  NOT_FOUND:           'NOT_FOUND',            // 404
  CONFLICT:            'CONFLICT',             // 409
  ALREADY_EXISTS:      'ALREADY_EXISTS',       // 409
  INTERNAL_ERROR:      'INTERNAL_ERROR',       // 500
} as const;
```

These are string constants, not a TypeScript enum — the values are what they look like in JSON responses.

## The Error Handler Middleware

The error handler is registered as the last middleware in `index.ts`:

```typescript
app.use(errorHandler);
```

Express recognizes error handlers by their four-argument signature. Anything passed to `next(error)` from any route or middleware ends up here:

```typescript
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    logger.warn(
      { code: err.code, statusCode: err.statusCode, path: req.path },
      err.message
    );
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Unexpected errors — log with full stack trace
  logger.error({ err, path: req.path, method: req.method }, 'Unexpected error');

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    statusCode: 500,
  });
}
```

Two paths through the handler:

**Known `ApiError`** — Logged as a warning (expected failure, not a bug), and the formatted response is returned. The stack trace isn't logged because you threw this intentionally.

**Unknown error** — Something genuinely unexpected. Logged as an error with the full `err` object including the stack trace, so you can debug it. In production, the response shows a generic message so internal details don't leak. In development, `err.message` is shown so you can see what happened without opening your log viewer.

## How Errors Flow

This sequence happens automatically:

```
Route handler throws ApiError.notFound('User')
         ↓
asyncHandler catches it → passes to next(err)
         ↓
Express routes to errorHandler (four-argument middleware)
         ↓
errorHandler logs it and sends JSON response
         ↓
Client receives { error: 'NOT_FOUND', message: 'User not found', statusCode: 404 }
```

For synchronous middleware like `requireAuth`, errors are passed to `next()` directly instead of thrown — but they end up in the same error handler either way.

## Using Errors in Route Handlers

```typescript
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input shape
  if (!email || !password) {
    throw ApiError.validationError('Validation failed', {
      ...(email ? {} : { email: 'Email is required' }),
      ...(password ? {} : { password: 'Password is required' }),
    });
  }

  // Check credentials
  const user = await userRepo.findOne({ where: { email } });
  const valid = user && await bcrypt.compare(password, user.passwordHash ?? '');
  if (!valid) {
    // Same error whether the email doesn't exist or the password is wrong —
    // an attacker shouldn't be able to tell which one failed
    throw ApiError.invalidCredentials();
  }

  // Success path
  req.session.userId = user.id;
  res.json({ id: user.id, email: user.email, name: user.name });
}));
```

## Frontend Error Handling

The frontend uses the `ErrorResponse` type from `@app-shell/shared` to handle API errors. The `apiRequest` and `useApi` hooks automatically parse error responses:

```typescript
const result = await apiRequest<User>('/api/me');

if (result.error) {
  switch (result.error.error) {
    case 'UNAUTHORIZED':
      router.push('/login');
      break;
    case 'VALIDATION_ERROR':
      // Apply field-specific errors to the form
      Object.entries(result.error.details ?? {}).forEach(([field, message]) => {
        form.setError(field, { message });
      });
      break;
    default:
      toast.error(result.error.message);
  }
}
```

The machine-readable `error` code is what makes this switching possible. A human-readable message alone would require fragile string matching.

## Best Practices

**Use factory methods, not the constructor.** `ApiError.notFound('User')` is clearer than `new ApiError('User not found', 404, 'NOT_FOUND')`.

**Validate before touching the database.** Collect all validation errors first and throw once — don't make the user fix one field at a time.

**Return the same error for security-sensitive operations.** Whether a login fails because the email doesn't exist or the password is wrong, the client should see `INVALID_CREDENTIALS` — not two different messages that reveal which one failed.

**Don't expose internal details in production.** Throw `ApiError.internal()` for unexpected database errors or third-party failures. The error handler logs the real error; the client gets a generic message.

**Let asyncHandler catch database errors.** You don't need to catch TypeORM errors in your route handlers unless you want to transform them into specific `ApiError` responses. If a database call throws unexpectedly, it bubbles to the error handler and becomes a 500.

## Next Steps

- **[Middleware](/dashboard/docs/backend/middleware)** — How asyncHandler and the error handler fit into the middleware stack
- **[API Routes](/dashboard/docs/backend/api-routes)** — How errors are thrown in practice across all routes
