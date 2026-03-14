# Express Overview

<!-- AI_CONTEXT
This document explains the Express backend API structure.
Key files: apps/api/src/index.ts, apps/api/src/middleware/, apps/api/src/env.ts
Framework: Express with TypeScript
All routes defined inline in apps/api/src/index.ts — no routes/ subdirectory.
Server only starts if require.main === module (allows clean unit testing).
Graceful shutdown: SIGTERM/SIGINT handlers call server.close() then process.exit(0).
CORS: getLanOrigin() allows 192.168.x.x and 10.x.x.x in development.
dev-login endpoint: POST /api/auth/dev-login — no environment guard in current code.
GET /api/auth/verify-reset-token exists (validates token before showing reset form).
optionalAuth middleware exists in middleware/auth.ts (attaches userId if session exists, doesn't reject).
PORT internal default is 4000 (mapped externally to 4001 via Docker).
Related docs: database, api-routes, middleware, error-handling
-->

## What Express Is

Express is a web framework for Node.js. If you've heard of a web framework before, the concept is simple: when a browser sends a request to a URL, something on the server needs to decide what code to run in response. Express is the library that wires those two things together.

Unlike heavier frameworks that generate folder structures, enforce conventions, and abstract away the HTTP layer, Express stays out of your way. It gives you a few core concepts — middleware and route handlers — and lets you compose them however you want. This makes it easy to read, easy to reason about, and easy to extend.

App Shell's entire API — authentication, user profiles, password reset, session management, admin endpoints — is about 840 lines in a single file.

## The Entry Point

Everything starts in `apps/api/src/index.ts`. The file does a few things in order:

**1. Validate environment variables**

The very first import is `env.ts`. It validates that all required environment variables are present and correctly formatted. If anything is missing or wrong, the process exits immediately with a clear error before Express even starts.

**2. Connect to the database**

Before accepting requests, the API waits for TypeORM to connect to PostgreSQL and sync the schema. If the database isn't ready, the server doesn't start.

**3. Configure middleware**

Middleware is code that runs on every request before it reaches a route handler. The stack, in order:

```typescript
app.use(pinoHttp({ logger }));   // Log every request
app.use(helmet());                // Set security headers
app.use(cors({ ... }));           // Allow the frontend to make requests
app.use(express.json());          // Parse JSON request bodies
app.use(session({ ... }));        // Attach session data to req.session
```

**4. Mount routes**

All endpoints are defined inline below the middleware. There's no separate `routes/` directory.

**5. Register the error handler**

The error handler must be last. Express identifies error-handling middleware by its four-argument signature `(err, req, res, next)`. Anything registered before it is a normal middleware or route.

**6. Start the server**

```typescript
if (require.main === module) {
  app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });
}
```

The `require.main === module` check means the server only starts if the file is run directly. When tests import `index.ts`, they get the Express app without accidentally starting a live server on a port.

## Graceful Shutdown

The server registers handlers for `SIGTERM` and `SIGINT` signals. When either arrives (which is what Docker sends when stopping a container, or what you get when pressing `Ctrl+C`), the server stops accepting new connections and waits for in-flight requests to finish before exiting:

```typescript
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
```

Without this, stopping the container mid-request could leave database operations half-done or return truncated responses to the client.

## All Routes at a Glance

```
GET  /healthz                          Basic health check
GET  /readyz                           Readiness check (includes DB connectivity)

POST /api/auth/register                Create a new account
POST /api/auth/login                   Log in with email + password
POST /api/auth/logout                  End the current session
POST /api/auth/forgot-password         Request a password reset email
GET  /api/auth/verify-reset-token      Check if a reset token is still valid
POST /api/auth/reset-password          Set a new password using a token
POST /api/auth/dev-login               Create/login a dev admin account (dev convenience)

GET  /api/me                           Get the current user's profile
PUT  /api/me                           Update name or avatar
PUT  /api/me/password                  Change password (requires current password)
GET  /api/me/sessions                  List all active sessions
DELETE /api/me/sessions/:id            Revoke a specific session
DELETE /api/me/sessions                Revoke all other sessions (keep current)

GET  /api/admin/users                  List all users (admin only)
PUT  /api/admin/users/:id/role         Change a user's role (admin only)
DELETE /api/admin/users/:id            Delete a user (admin only)
```

## The asyncHandler Wrapper

Express was designed before `async/await` existed. If an async route handler throws an error, Express won't catch it automatically — the error just disappears and the request hangs. The fix is `asyncHandler`:

```typescript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

Every async route in App Shell is wrapped with it. When anything inside throws, the error is passed to `next()`, which routes it to the error handler. This means route handlers never need `try/catch` blocks:

```typescript
app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await userRepo.findOneOrFail({ where: { id: req.session.userId } });
  res.json(user);
  // If findOneOrFail throws, asyncHandler catches it and passes it to errorHandler
}));
```

## Technologies at a Glance

| Package | What it does |
|---------|-------------|
| `express` | HTTP routing and middleware framework |
| `helmet` | Sets a collection of security-related HTTP headers automatically |
| `cors` | Controls which origins can make requests (prevents unauthorized cross-site calls) |
| `express-session` | Attaches session data to requests and persists it to PostgreSQL |
| `connect-pg-simple` | The adapter that stores express-session data in PostgreSQL |
| `pino` / `pino-http` | Fast structured logging — logs JSON objects rather than strings |
| `bcrypt` | Password hashing algorithm designed to be slow (makes brute-force attacks expensive) |
| `nodemailer` | Sends emails (used for password reset) |

## API Documentation

While the app is running locally, an interactive API reference is available at:

```
http://localhost:4001/api-docs
```

This is a Swagger UI — a browser interface that lists every endpoint, describes expected inputs, and lets you make real requests without writing any code. It's generated from JSDoc comments in `index.ts`.

## Next Steps

- **[Database](/dashboard/docs/backend/database)** — How TypeORM connects to PostgreSQL and what the entities look like
- **[API Routes](/dashboard/docs/backend/api-routes)** — The patterns every route handler follows
- **[Middleware](/dashboard/docs/backend/middleware)** — Auth, CORS, sessions, and error handling in depth
- **[Error Handling](/dashboard/docs/backend/error-handling)** — The ApiError class and consistent error responses
