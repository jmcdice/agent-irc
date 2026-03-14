# CORS

<!-- AI_CONTEXT
This document covers Cross-Origin Resource Sharing configuration.
Key files: apps/api/src/utils/cors.ts, apps/api/src/index.ts
CORS utility: getAllowedOrigins() in cors.ts builds the static list; LAN IP pattern check is inline in index.ts.
WEB_URL defaults to http://localhost:3000 (container-internal port, not 3001).
In development: also allows localhost:3001, 127.0.0.1:3000, 127.0.0.1:3001, and LAN ranges 192.168.x.x and 10.x.x.x.
!origin is allowed (server-to-server requests, Swagger UI, curl, mobile apps don't send an Origin header).
Rejected origins are logged as warnings.
CORS_ORIGINS: optional comma-separated list of additional allowed origins.
credentials: true is required for cookies to be sent cross-origin.
Related docs: backend/middleware, security/environment
-->

## What CORS Is and Why It Exists

Imagine you're logged into your bank. While that tab is open, you visit a malicious website in another tab. Without any protection, that malicious site could use your browser to send requests to your bank's API — and your browser would automatically attach your session cookie to those requests, authenticating them as you.

**CORS** (Cross-Origin Resource Sharing) is the browser mechanism that prevents this. When your frontend at `localhost:3001` makes a request to the API at `localhost:4001`, those are different origins (different ports count). The browser checks whether the API has explicitly told it that `localhost:3001` is allowed to make requests. If not, the browser blocks the response from reaching the frontend's JavaScript code.

The key word is *browser*. CORS is enforced by browsers to protect users. Tools like curl, Postman, or server-to-server requests don't enforce it — CORS is not a firewall, it's a browser-level policy.

## How It Works

Before sending some requests (particularly ones with credentials or certain headers), the browser sends a **preflight** request using the HTTP `OPTIONS` method. The API responds with headers saying which origins, methods, and headers are allowed. The browser reads those headers and decides whether to send the actual request.

```
Browser (origin: localhost:3001)
  → OPTIONS /api/me (preflight)
  ← Access-Control-Allow-Origin: http://localhost:3001
  ← Access-Control-Allow-Credentials: true
  → GET /api/me (with cookie)
  ← { id: "...", email: "..." }
```

If the API doesn't respond with the right headers, the browser blocks the response. Your API still ran the request — you just can't see the result. This is why CORS errors show up in the browser console but not in API logs as failures.

## App Shell's CORS Setup

CORS is configured in `index.ts` using two mechanisms:

**`getAllowedOrigins()`** — a function in `utils/cors.ts` that builds a static list of allowed origins:

```typescript
export const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Always allow the frontend URL
  origins.push(env.WEB_URL); // defaults to http://localhost:3000

  // Additional origins from environment config
  if (env.CORS_ORIGINS) {
    origins.push(...env.CORS_ORIGINS.split(',').map(o => o.trim()));
  }

  // In non-production: also allow common dev origins
  if (env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3001');
    origins.push('http://127.0.0.1:3000');
    origins.push('http://127.0.0.1:3001');
  }

  return origins;
};
```

**The cors middleware in `index.ts`** — applies the list and adds LAN IP support for development:

```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // No Origin header = server-to-server, curl, Swagger UI, mobile apps
    if (!origin) return callback(null, true);

    // Static allowed list
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Development: allow any LAN IP for device testing
    if (env.NODE_ENV !== 'production') {
      const lanPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/;
      if (lanPattern.test(origin)) return callback(null, true);
    }

    logger.warn({ origin, allowedOrigins }, 'CORS request from disallowed origin');
    callback(null, false);
  },
  credentials: true, // Required for session cookies to be sent
}));
```

## `credentials: true`

This option is non-negotiable if you want cookies to work cross-origin. Without it, the browser strips the session cookie from every API request and every request appears unauthenticated.

The flip side: when `credentials: true` is set, the `Access-Control-Allow-Origin` header cannot be a wildcard (`*`). It must name a specific origin. That's why App Shell uses a function to dynamically select the right origin rather than a simple `origin: '*'`.

The frontend also needs to opt in on its end:

```typescript
fetch('/api/me', { credentials: 'include' })
```

The `useApi` hook does this automatically.

## Allowed Origins in Development

| Origin | When Allowed | Why |
|--------|-------------|-----|
| `env.WEB_URL` (default: `http://localhost:3000`) | Always | The frontend container's internal port |
| `http://localhost:3001` | Non-production | The externally mapped dev port |
| `http://127.0.0.1:3000` and `3001` | Non-production | Alternate localhost form |
| `192.168.x.x:*` | Non-production | Home/office LAN for device testing |
| `10.x.x.x:*` | Non-production | VPN/corporate LAN for device testing |
| No `Origin` header | Always | Server-to-server, curl, Swagger UI |

The LAN IP ranges mean you can open the API directly from your phone or another computer on the same WiFi network — useful for mobile testing without deploying anywhere.

## Production Configuration

In production, lock down the allowed origins to exactly what you need:

```bash
WEB_URL=https://app.example.com
CORS_ORIGINS=https://staging.example.com
NODE_ENV=production
```

With `NODE_ENV=production`:
- LAN access is disabled
- Localhost variants are not included
- Only `WEB_URL` and `CORS_ORIGINS` origins are allowed
- All rejected origins are logged as warnings

## Adding More Origins

The `CORS_ORIGINS` environment variable accepts a comma-separated list:

```bash
CORS_ORIGINS=https://staging.example.com,https://app2.example.com
```

This is useful for staging environments, preview deployments, or multiple frontend domains hitting the same API.

## Troubleshooting

**"CORS request from disallowed origin" in API logs**

The origin of your request isn't in the allowed list. Check `WEB_URL` matches your actual frontend URL exactly — including protocol (`http` vs `https`) and port.

**"CORS error" in browser console but the request appears in API logs**

This is almost always a `credentials` mismatch. Make sure:
- `credentials: true` in the CORS config (it is, by default)
- `credentials: 'include'` in your fetch call (the `useApi` hook does this)
- You're not accidentally hitting a different API URL than expected

**Cookies not being sent**

Check that your frontend and API URLs are correctly configured. In production, they typically need to be on the same top-level domain (or subdomains of it) for cookies to work smoothly.

## Next Steps

- **[Security Headers](/dashboard/docs/security/headers)** — What Helmet sets and why
- **[Middleware](/dashboard/docs/backend/middleware)** — How CORS fits into the middleware stack
