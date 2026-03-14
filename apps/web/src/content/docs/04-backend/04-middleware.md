# Middleware

<!-- AI_CONTEXT
This document covers Express middleware configuration.
Key files: apps/api/src/middleware/auth.ts, apps/api/src/middleware/errorHandler.ts, apps/api/src/index.ts
Middleware functions: requireAuth, optionalAuth, requireRole (all in middleware/auth.ts)
IMPORTANT: requireAuth uses next(ApiError.unauthorized()) NOT throw — subtle but important for Express error routing.
IMPORTANT: optionalAuth exists and attaches userId to session if present but does NOT reject unauthenticated requests.
IMPORTANT: requireRole fetches the user from DB and caches it on req.user — downstream handlers can use req.user directly.
requireRole accepts string | string[] — single role or array of allowed roles.
CORS: getLanOrigin() allows 192.168.x.x and 10.x.x.x ranges in development (for testing on real devices).
Session: connect-pg-simple with createTableIfMissing: true, 30-day cookies, httpOnly, secure in production, sameSite: lax.
asyncHandler: defined inline in index.ts, wraps async handlers to catch errors and pass to next().
Related docs: express-overview, api-routes, error-handling, security/headers
-->

## What Middleware Is

Middleware is code that runs between receiving a request and sending a response. In Express, middleware functions form a pipeline — each one receives the request, does something with it, and either sends a response or passes control to the next function in the chain.

```
Request → logging → security headers → CORS → body parsing → sessions → route handler → error handler → Response
```

Everything before the route handler is middleware. The error handler is also middleware — it just lives at the end and only runs when something goes wrong.

## The Middleware Stack

App Shell configures middleware in `index.ts` in this order:

```typescript
app.use(pinoHttp({ logger }));          // 1. Log every request
app.use(helmet());                       // 2. Set security headers
app.use(cors({ origin: isAllowed, credentials: true })); // 3. CORS
app.use(express.json());                 // 4. Parse JSON bodies
app.use(session({ ... }));              // 5. Attach session to req.session
```

Order matters. JSON bodies need to be parsed before route handlers read `req.body`. Sessions need to be initialized before route handlers read `req.session`. Logging first ensures every request gets logged even if a later middleware crashes.

## Request Logging

**Pino** is the logging library. It logs structured JSON rather than plain text strings, which makes logs easy to search and analyze in production tooling:

```
{"level":30,"time":1704067200000,"req":{"method":"GET","url":"/api/me"},"res":{"statusCode":200},"responseTime":12}
```

In development, `pino-pretty` reformats this into readable colored output. In production, it stays as JSON for log aggregators.

## Security Headers (Helmet)

```typescript
app.use(helmet());
```

**Helmet** sets a collection of HTTP response headers that browsers use to enforce security policies. With one line you get:

- `X-Content-Type-Options: nosniff` — prevents browsers from guessing the content type
- `X-Frame-Options: SAMEORIGIN` — prevents your pages from being embedded in iframes on other sites (clickjacking protection)
- `Strict-Transport-Security` — tells browsers to always use HTTPS for this domain
- `Content-Security-Policy` — controls which resources the browser is allowed to load
- Several others

These are set automatically. You don't need to think about them.

## CORS

**CORS** (Cross-Origin Resource Sharing) is a browser security mechanism that controls which websites can make requests to your API. Without it, any website could send requests to your API as the logged-in user.

The CORS configuration in App Shell uses a function to decide whether an origin is allowed:

```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,  // Required for cookies to be sent cross-origin
}));
```

`getAllowedOrigins()` returns the frontend URL from environment variables. In development, it also includes LAN IP ranges (192.168.x.x and 10.x.x.x) so you can test on a real device connected to the same network — useful for mobile testing.

`credentials: true` is required for the session cookie to be sent with cross-origin requests. Without it, the browser would strip the cookie from API calls and every request would appear unauthenticated.

## Session Management

**express-session** is the middleware that makes authentication work. It reads the session cookie from every incoming request, looks up that session ID in the database, and attaches the session data to `req.session`. When a handler writes to `req.session`, the changes are persisted back to the database automatically.

```typescript
app.use(session({
  store: new PgSession({
    conString: getDatabaseUrl(),
    createTableIfMissing: true,  // Creates the sessions table on first start
  }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days in milliseconds
    httpOnly: true,   // JavaScript can't access this cookie
    secure: env.NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'lax',  // Sent on navigation, blocked on cross-site POST
  },
}));
```

A few important details:

- **`createTableIfMissing: true`** — `connect-pg-simple` creates the `sessions` table automatically if it doesn't exist. You don't need to run a migration.
- **`httpOnly: true`** — The browser's JavaScript can't read this cookie. If a malicious script runs on your page, it can't steal the session ID.
- **`secure: true` in production** — The cookie is only sent over HTTPS. In development, HTTP is fine.
- **`sameSite: 'lax'`** — The cookie is sent when navigating to the site, but not on cross-site POST requests. This blocks CSRF attacks while allowing normal navigation.
- **`SESSION_SECRET`** is the key used to sign the cookie, preventing tampering. In development and test, `env.ts` provides a default value so you don't need to configure anything. In production, it must be set to a long random string.

## Authentication Middleware

### requireAuth

Protects routes that require a logged-in user. If `req.session.userId` is missing or falsy, it rejects the request with a 401:

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return next(ApiError.unauthorized());
  }
  next();
}
```

Notice the pattern: errors are passed to `next()` rather than thrown. This is how Express routes errors to the error handler middleware. Throwing inside regular (non-async) middleware would crash the process rather than producing a clean error response.

Usage:

```typescript
app.get('/api/me', requireAuth, asyncHandler(async (req, res) => {
  // req.session.userId is guaranteed to be set here
}));
```

### optionalAuth

A softer version of `requireAuth`. It attaches the session `userId` to the request if one exists, but doesn't reject unauthenticated requests. Useful for routes that behave differently for logged-in vs anonymous users, but can serve both:

```typescript
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // req.session.userId will be set if authenticated, undefined if not
  next();
}
```

### requireRole

Checks that the authenticated user has a specific role. Must be used after `requireAuth` since it relies on `req.session.userId` being set:

```typescript
export function requireRole(role: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.session.userId } });
    const allowed = Array.isArray(role) ? role : [role];

    if (!user || !allowed.includes(user.role)) {
      return next(ApiError.forbidden());
    }

    req.user = user;  // Cache the user object for downstream handlers
    next();
  };
}
```

Two things worth noting:

1. **The role argument accepts an array** — `requireRole(['admin', 'moderator'])` allows either role.
2. **The fetched user is cached on `req.user`** — downstream route handlers can use `req.user` directly instead of fetching the user again from the database.

Usage:

```typescript
app.get('/api/admin/users',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    // req.user is the admin user object, already fetched
  })
);
```

## The asyncHandler Wrapper

Express doesn't automatically catch errors in async route handlers. `asyncHandler` solves this:

```typescript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

When an async handler throws or rejects, `.catch(next)` passes the error to Express's error routing, which sends it to the error handler middleware. Without this, unhandled promise rejections would crash the process silently.

```typescript
// Without asyncHandler — you'd need to catch everything manually
app.get('/api/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// With asyncHandler — errors are caught automatically
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

## The Error Handler

The error handler lives at the very end of the middleware stack and catches anything that reaches it via `next(err)`. See [Error Handling](/dashboard/docs/backend/error-handling) for a full walkthrough.

## Writing Custom Middleware

A middleware function takes three arguments: `req`, `res`, and `next`. Call `next()` to pass control forward, `next(error)` to route to the error handler, or send a response directly to short-circuit the chain.

```typescript
// A simple middleware that adds a request ID to every request
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();  // Continue to the next middleware or route
}
```

```typescript
// Middleware that limits access by IP
export function allowLocalOnly(req: Request, res: Response, next: NextFunction) {
  if (req.ip !== '127.0.0.1' && req.ip !== '::1') {
    return next(ApiError.forbidden('Local access only'));
  }
  next();
}
```

Register global middleware with `app.use()`. Apply route-specific middleware inline:

```typescript
app.get('/api/admin/debug', requireAuth, requireRole('admin'), allowLocalOnly, asyncHandler(async (req, res) => {
  // Three middleware checks before the handler runs
}));
```

## Next Steps

- **[Error Handling](/dashboard/docs/backend/error-handling)** — How the error handler formats and logs errors
- **[Security](/dashboard/docs/security/headers)** — Helmet configuration in depth
