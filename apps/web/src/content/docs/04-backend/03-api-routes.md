# API Routes

<!-- AI_CONTEXT
This document covers API route patterns and conventions.
Key file: apps/api/src/index.ts (all routes defined here — no routes/ subdirectory)
Patterns: asyncHandler wrapper, req.session.userId, req.user (set by requireRole), Zod-style manual validation
All routes: GET /healthz, GET /readyz, POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout,
  POST /api/auth/forgot-password, GET /api/auth/verify-reset-token, POST /api/auth/reset-password,
  POST /api/auth/dev-login, GET /api/me, PUT /api/me, PUT /api/me/password,
  GET /api/me/sessions, DELETE /api/me/sessions/:id, DELETE /api/me/sessions,
  GET /api/admin/users, PUT /api/admin/users/:id/role, DELETE /api/admin/users/:id
dev-login: creates admin user if not exists, sets session directly — no environment check in current code.
verify-reset-token: GET with token query param — validates token before reset form is shown.
forgot-password returns success even if email not found (prevents account enumeration).
Related docs: express-overview, middleware, error-handling
-->

## How Routes Work in Express

A route is a combination of an HTTP method (GET, POST, PUT, DELETE) and a URL path. When a request arrives, Express matches it against registered routes in the order they were defined and runs the first match.

```typescript
app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  // This runs when someone sends GET /api/me
}));
```

Every route in App Shell follows the same structure: the method and path, followed by any middleware, followed by the handler wrapped in `asyncHandler`. All routes are defined in `apps/api/src/index.ts` — there's no `routes/` subdirectory.

## The Standard Route Handler Pattern

Here's the pattern every handler follows:

```typescript
app.post('/api/resource', requireAuth, asyncHandler(async (req, res) => {
  // 1. Extract and validate input
  const { name, email } = req.body;
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  if (Object.keys(errors).length > 0) {
    throw ApiError.validationError('Validation failed', errors);
  }

  // 2. Check business rules
  const existing = await repo.findOne({ where: { email } });
  if (existing) throw ApiError.alreadyExists('Email');

  // 3. Do the work
  const resource = repo.create({ name, email });
  await repo.save(resource);

  // 4. Log it
  logger.info({ resourceId: resource.id }, 'Resource created');

  // 5. Respond
  res.status(201).json({ id: resource.id, name: resource.name });
}));
```

Validation runs first. Business rules run next. The actual work only happens if both pass. This order means you never do expensive database operations on invalid input.

## How the Session Flows Through a Request

Every protected route reads the user's identity from `req.session.userId`. This value was written there by the login handler when the user authenticated, and it's automatically loaded from the database on every subsequent request by the session middleware.

```typescript
app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.session.userId!; // requireAuth guarantees this exists
  const user = await userRepo.findOneOrFail({ where: { id: userId } });
  res.json(user);
}));
```

`requireAuth` ensures `req.session.userId` is present before the handler runs. If it isn't, the request is rejected with a 401 before your code ever executes. See [Middleware](/dashboard/docs/backend/middleware) for how `requireAuth` works.

## Route Reference

### Health Checks

```
GET /healthz
```
Returns `{ status: 'ok' }`. Used by Docker's health check to confirm the process is running. No authentication required.

```
GET /readyz
```
Returns `{ status: 'ok', database: 'connected' }` when the database is also reachable. Used during deployment to confirm the service is ready to accept traffic.

---

### Authentication

```
POST /api/auth/register
```
Creates a new account. Expects `{ email, name, password }`. Validates that email isn't already taken, hashes the password with bcrypt (cost factor 10), saves the user, and establishes a session automatically — the user is logged in immediately after registering.

```
POST /api/auth/login
```
Expects `{ email, password }`. Looks up the user by email, compares the submitted password against the stored hash using `bcrypt.compare`, and establishes a session. Returns `ApiError.invalidCredentials()` if either the email doesn't exist or the password doesn't match — the same error either way, so an attacker can't tell which one was wrong.

```
POST /api/auth/logout
```
Destroys the current session using `req.session.destroy()` and clears the session cookie. Protected by `requireAuth`.

```
POST /api/auth/forgot-password
```
Expects `{ email }`. If the email exists, generates a cryptographically random token, stores it in `reset_tokens` with a one-hour expiration, and sends a reset email. If the email doesn't exist, the response is identical to the success case — this prevents someone from using the endpoint to discover which email addresses are registered.

```
GET /api/auth/verify-reset-token?token=<token>
```
Checks whether a reset token is valid (exists, not expired, not already used). The frontend calls this when the user lands on the reset password page so it can show an error immediately if the token is bad, rather than letting them fill out the form only to be rejected on submit.

```
POST /api/auth/reset-password
```
Expects `{ token, password }`. Validates the token, hashes the new password, updates the user's `passwordHash`, marks the token as used by setting `usedAt`, and invalidates all existing sessions so anyone who had access with the old password is logged out.

```
POST /api/auth/dev-login
```
A convenience endpoint for development. Expects `{ email, name }`. Finds or creates an admin account with that email and establishes a session in one step — bypassing registration, email verification, and the login form. Useful for quickly getting into the app without going through the full auth flow.

> **Note:** This endpoint has no environment check in the current code. When you deploy, you'll want to either remove it or gate it on `NODE_ENV`. The dev-login shortcut in the [Quick Start](/dashboard/docs/getting-started/quick-start) must be called from the browser (not a tool like curl) because it sets a session cookie.

---

### User Profile

```
GET /api/me
```
Returns the current user's profile. Protected by `requireAuth`. The response omits `passwordHash`.

```
PUT /api/me
```
Updates `name` and/or `avatarUrl`. Validates that `name` isn't empty if provided. Protected by `requireAuth`.

```
PUT /api/me/password
```
Changes the user's password. Expects `{ currentPassword, newPassword }`. Verifies the current password first — you can't change a password you don't know. Protected by `requireAuth`.

```
GET /api/me/sessions
```
Returns all active sessions for the current user, found by querying the `sessions` table for records whose `sess` JSON contains the current `userId`. The response includes session IDs, creation times, and expiry dates so the frontend can display them. Protected by `requireAuth`.

```
DELETE /api/me/sessions/:id
```
Revokes a specific session by its `sid`. Protected by `requireAuth`. The handler also checks that the session belongs to the current user before deleting it.

```
DELETE /api/me/sessions
```
Revokes all sessions *except* the current one. This is the "log out everywhere else" action. Protected by `requireAuth`.

---

### Admin

All admin routes require both `requireAuth` and `requireRole('admin')`. A user with the `user` role will receive a 403 Forbidden.

```
GET /api/admin/users
```
Returns all user accounts. Useful for user management dashboards.

```
PUT /api/admin/users/:id/role
```
Changes a user's role. Expects `{ role }` where role is `'user'` or `'admin'`.

```
DELETE /api/admin/users/:id
```
Deletes a user account. Also deletes their sessions and any password reset tokens.

---

## Adding a New Route

1. **Open `apps/api/src/index.ts`** and find where it makes sense to add your route (group it with related routes).

2. **Write the handler**, following the standard pattern: validate input, check business rules, do the work, respond.

3. **Add middleware** as needed — `requireAuth` for protected routes, `requireRole('admin')` for admin-only ones.

4. **Add a Swagger comment** above the route so it appears in the API docs:

   ```typescript
   /**
    * @swagger
    * /api/projects:
    *   post:
    *     summary: Create a project
    *     tags: [Projects]
    *     security:
    *       - cookieAuth: []
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             required: [name]
    *             properties:
    *               name:
    *                 type: string
    *     responses:
    *       201:
    *         description: Project created
    *       401:
    *         description: Not authenticated
    */
   app.post('/api/projects', requireAuth, asyncHandler(async (req, res) => {
     // ...
   }));
   ```

5. **Write a test** in `apps/api/src/tests/`. See the existing auth tests for the pattern.

## Response Shape

Successful responses return whatever makes sense for the operation — usually a JSON object or array with no wrapper:

```json
{ "id": "uuid", "email": "user@example.com", "name": "Alice", "role": "user" }
```

Error responses always follow the same structure:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "statusCode": 400,
  "details": {
    "email": "Email is required"
  }
}
```

The `error` field is a machine-readable code the frontend can switch on. The `message` is human-readable. `details` is present for validation errors to map errors back to form fields.

## Next Steps

- **[Middleware](/dashboard/docs/backend/middleware)** — How requireAuth, requireRole, and CORS work
- **[Error Handling](/dashboard/docs/backend/error-handling)** — The ApiError class in detail
