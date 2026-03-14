# Environment Variables

<!-- AI_CONTEXT
This document covers secure environment variable handling.
Key files: apps/api/src/env.ts
IMPORTANT: There is NO apps/web/src/lib/env.ts — Next.js handles env vars natively.
IMPORTANT: SESSION_SECRET has a dev/test default ('dev-session-secret-change-in-production') — you do NOT need to set it in development.
IMPORTANT: DATABASE_URL is OPTIONAL — the app uses individual DB_HOST, DB_PORT, etc. params by default. DATABASE_URL is only used if explicitly set (for connect-pg-simple session store via getDatabaseUrl() helper).
IMPORTANT: DATABASE_URL is NOT required in production — individual DB params are used.
Required in production: SESSION_SECRET (no default applied in production).
env.ts uses Zod for validation, exits with clear error messages on failure.
Port defaults: PORT=4000 (internal), mapped to 4001 externally by Docker.
WEB_URL defaults to http://localhost:3000 (container-internal).
Related docs: backend/express-overview, architecture/docker-setup
-->

## What Environment Variables Are

An environment variable is a value set outside your code — in the shell, in a Docker Compose file, or in a hosting platform's settings panel — that your application reads at startup. They're how you configure an application differently across contexts without changing the source code.

Your development database probably has a weak password and is on your local machine. Your production database has a strong password and is on a private network. Both configurations live in environment variables, not in code. The code just reads `DB_PASSWORD` and uses whatever value it finds.

The cardinal rule: **secrets never go in code**. A password, API key, or session secret committed to a git repository is compromised — anyone with repository access can see it, and if the repo is ever public, it's exposed permanently.

## Backend Environment Validation

The API's `env.ts` is the first thing `index.ts` imports. It reads environment variables, validates them with Zod, and exports a typed `env` object. If anything required is missing or malformed, the process exits immediately with a clear error before the server even tries to start.

Here's the actual schema:

```typescript
const envSchema = z.object({
  // Server
  PORT: z.string().default('4000').transform(Number).pipe(z.number().int().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database connection params
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_USER: z.string().default('app_user'),
  DB_PASSWORD: z.string().default('app_pass'),
  DB_NAME: z.string().default('app_db'),

  // Optional — only used by connect-pg-simple if explicitly set
  DATABASE_URL: z.string().optional(),

  // Session — required in production, has dev default otherwise
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),

  // CORS
  WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().optional(),
});
```

The validation runs against a modified `process.env` that adds a development default for `SESSION_SECRET`:

```typescript
const envWithDefaults = {
  ...process.env,
  SESSION_SECRET:
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== 'production'
      ? 'dev-session-secret-change-in-production'
      : undefined),
};
```

In development and test, `SESSION_SECRET` is automatically provided. In production, it must be explicitly set — otherwise the process exits with an error.

## All Variables Reference

| Variable | Default | Required in Production | Purpose |
|----------|---------|----------------------|---------|
| `PORT` | `4000` | No | Internal server port (mapped to 4001 externally by Docker) |
| `NODE_ENV` | `development` | Yes (`production`) | Changes logging, cookie security, synchronize behavior |
| `DB_HOST` | `localhost` | Yes | PostgreSQL hostname (`db` inside Docker) |
| `DB_PORT` | `5432` | No | PostgreSQL port (internal Docker network) |
| `DB_USER` | `app_user` | Yes | Database user |
| `DB_PASSWORD` | `app_pass` | Yes | Database password |
| `DB_NAME` | `app_db` | Yes | Database name |
| `DATABASE_URL` | — | No | Optional connection URL (for external services) |
| `SESSION_SECRET` | Dev default | **Yes** | Signs session cookies; must be a long random string |
| `WEB_URL` | `http://localhost:3000` | Yes | Frontend URL for CORS; defaults to container-internal port |
| `CORS_ORIGINS` | — | No | Additional allowed CORS origins (comma-separated) |

## Why DATABASE_URL Isn't Separately Required

The API connects to PostgreSQL using the individual `DB_*` params, not a `DATABASE_URL` string. The `DATABASE_URL` variable is optional — if set, it's used by the `connect-pg-simple` session store. If not, the `getDatabaseUrl()` helper constructs a URL from the individual params:

```typescript
export function getDatabaseUrl(): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  return `postgres://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
}
```

You only need to set `DATABASE_URL` if you're using an external database service that provides connection strings (like Supabase, Railway, or Neon). If you're using the Docker-composed database, the individual params handle everything.

## Frontend Environment Variables

Next.js has built-in environment variable support — no separate validation file needed.

Variables prefixed with `NEXT_PUBLIC_` are bundled into the client-side JavaScript and visible in the browser. Everything else is server-only:

```bash
# Visible in browser (OK for non-sensitive config)
NEXT_PUBLIC_API_URL=http://localhost:4001

# Server-only (Next.js server components, API routes, build-time only)
SOME_SECRET_KEY=...
```

The frontend uses `NEXT_PUBLIC_API_URL` in the `useApi` hook to know where to send requests. If it's not set, the hook falls back to `http://localhost:4001`.

## How Variables Flow in Development

Your local values live in a `.env` file at the project root. Docker Compose reads this file and passes the values into each container as environment variables. The API's `env.ts` reads them from `process.env`.

In Docker Compose, this looks like:

```yaml
services:
  api:
    environment:
      - NODE_ENV=development
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=app_user
      - DB_PASSWORD=app_pass
      - DB_NAME=app_db
      - SESSION_SECRET=${SESSION_SECRET:-dev-session-secret-change-in-production}
      - WEB_URL=http://web:3000
```

The `${SESSION_SECRET:-...}` syntax uses your `.env` value if set, otherwise falls back to the dev default.

## Environment Files

```
project-root/
├── .env.example     # Template — committed to git, no real secrets
├── .env             # Your local values — never committed
└── .gitignore       # Must include .env
```

The `.env.example` file is what you commit. It lists every variable with placeholder values so new developers know what to configure:

```bash
# .env.example

# Server
PORT=4001
NODE_ENV=development

# Database (Docker defaults — fine for local dev)
DB_HOST=db
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=app_pass
DB_NAME=app_db

# Session — generate a real secret for production
SESSION_SECRET=generate-a-strong-secret-for-production

# CORS
WEB_URL=http://localhost:3001
CORS_ORIGINS=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4001
```

## Production Session Secret

`SESSION_SECRET` signs every session cookie. If it's weak or leaked, an attacker can forge session cookies and impersonate any user.

Generate a strong secret:

```bash
openssl rand -hex 32
```

This produces 64 random hex characters. Use a different value for each environment (development, staging, production). Never reuse them.

Changing `SESSION_SECRET` in production will invalidate all existing sessions — every logged-in user will be logged out. Plan for this when rotating the secret.

## Startup Error Messages

If required variables are missing, the API exits before starting and prints exactly what's wrong:

```
❌ Environment validation failed:

  SESSION_SECRET:
    - SESSION_SECRET is required

💡 Required environment variables:
  - SESSION_SECRET (required in production)
```

This is intentional — failing loudly at startup is far better than a server that starts up and then crashes mysteriously when it first tries to use the missing value.

## Next Steps

- **[Docker Setup](/dashboard/docs/architecture/docker-setup)** — How Docker Compose passes these variables to containers
- **[CORS](/dashboard/docs/security/cors)** — How `WEB_URL` and `CORS_ORIGINS` control access
