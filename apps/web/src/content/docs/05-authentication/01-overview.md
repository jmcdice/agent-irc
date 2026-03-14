# Authentication Overview

<!-- AI_CONTEXT
This document provides an overview of the authentication system.
Key concepts: Session-based auth, bcrypt, PostgreSQL session store
Key files: apps/api/src/index.ts (auth routes), apps/api/src/middleware/auth.ts
Related docs: sessions, password-flows, rbac
-->

## Overview

App Shell uses **session-based authentication** with PostgreSQL as the session store. This approach provides:

- **Instant session revocation** - Log out anywhere, immediately
- **Session visibility** - Users can see and manage active sessions
- **Server-side control** - Sessions are controlled server-side
- **Simple implementation** - No token refresh complexity

## Authentication Flow

### Registration

```
┌──────────┐     POST /api/auth/register     ┌──────────┐
│  Client  │ ─────────────────────────────▶  │   API    │
│          │   { email, name, password }     │          │
│          │ ◀─────────────────────────────  │          │
│          │   Set-Cookie: session           │          │
└──────────┘   { user: {...} }               └──────────┘
```

### Login

```
┌──────────┐     POST /api/auth/login       ┌──────────┐
│  Client  │ ─────────────────────────────▶ │   API    │
│          │   { email, password }          │          │
│          │ ◀───────────────────────────── │          │
│          │   Set-Cookie: session          │          │
└──────────┘   { user: {...} }              └──────────┘
```

### Authenticated Requests

```
┌──────────┐     GET /api/me                ┌──────────┐
│  Client  │ ─────────────────────────────▶ │   API    │
│          │   Cookie: session              │          │
│          │ ◀───────────────────────────── │          │
│          │   { id, email, name, role }    │          │
└──────────┘                                └──────────┘
```

## How Sessions Work

### Session Creation

When a user logs in:

1. API verifies credentials
2. `express-session` creates a session in PostgreSQL
3. A `connect.sid` cookie is sent to the client
4. Client automatically includes this cookie in future requests

### Session Validation

On each authenticated request:

1. Express reads the `connect.sid` cookie
2. Looks up session in PostgreSQL
3. If valid, `req.session.userId` is populated
4. Route handler can access the user

### Session Storage

Sessions are stored in the `sessions` table:

```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);
```

## Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt with salt rounds |
| Session cookies | httpOnly, secure (prod), sameSite |
| Session expiry | 30-day maximum lifetime |
| Instant revocation | Delete from PostgreSQL |

## Configuration

### Session Options

```typescript
app.use(session({
  store: new PgSession({
    conString: DATABASE_URL,
    tableName: 'sessions',
  }),
  secret: env.SESSION_SECRET,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,   // No JavaScript access
    secure: true,     // HTTPS only (production)
    sameSite: 'lax',  // CSRF protection
  },
}));
```

### Environment Variables

```bash
# Required for production
SESSION_SECRET=your-secure-random-string

# Database for session store
DATABASE_URL=postgres://user:pass@host:5432/db
```

## Frontend Integration

The frontend handles auth state with:

```typescript
// Check if logged in
const response = await fetch('/api/me', { credentials: 'include' });
if (response.ok) {
  const user = await response.json();
  // User is authenticated
}

// Login
await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({ email, password }),
});

// Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

## Why Sessions Over JWTs?

| Aspect | Sessions | JWTs |
|--------|----------|------|
| Revocation | Instant | Requires token blacklist |
| Storage | Server-side | Client-side |
| Size | Small cookie | Large token |
| Session list | Built-in | Requires extra implementation |
| Complexity | Simpler | Token refresh needed |

For a web application with session management needs, sessions are the better choice.

## Next Steps

- **[Sessions](/dashboard/docs/authentication/sessions)** - Session management
- **[Password Flows](/dashboard/docs/authentication/password-flows)** - Reset, change
- **[RBAC](/dashboard/docs/authentication/rbac)** - Role-based access control

