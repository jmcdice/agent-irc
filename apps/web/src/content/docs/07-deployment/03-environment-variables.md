# Environment Variables Reference

<!-- AI_CONTEXT
This document is the complete reference for all environment variables.
Key files: apps/api/src/env.ts, docker-compose.yml, docker-compose.prod.yml
IMPORTANT: DATABASE_URL is optional — individual DB_* params are the primary connection method.
IMPORTANT: SESSION_SECRET has a dev/test default but is required in production.
IMPORTANT: PORT defaults to 4000 (internal Docker port), mapped to 4001 externally.
IMPORTANT: WEB_URL defaults to http://localhost:3000 (container-internal port), not 3001.
Individual DB params have defaults; DATABASE_URL is only needed for external managed databases.
NEXT_PUBLIC_API_URL: if not set, frontend falls back to http://localhost:4001.
Related docs: security/environment, docker, production-checklist
-->

Complete reference for all environment variables. For the concepts behind environment variables and secrets management, see [Environment Security](/dashboard/docs/security/environment).

---

## API Variables

All API variables are validated by `apps/api/src/env.ts` at startup using Zod. If a required variable is missing or invalid, the process exits immediately.

### Server

| Variable | Default | Production Value | Notes |
|----------|---------|-----------------|-------|
| `PORT` | `4000` | `4000` | Internal container port. Docker maps this to 4001 externally. |
| `NODE_ENV` | `development` | `production` | **Must be set.** Changes cookie security, logging, synchronize, error messages. |

### Database

| Variable | Default | Production Value | Notes |
|----------|---------|-----------------|-------|
| `DB_HOST` | `localhost` | e.g. `db` or your DB hostname | Inside Docker, use the service name `db`. |
| `DB_PORT` | `5432` | `5432` | Standard PostgreSQL port. |
| `DB_USER` | `app_user` | Your production DB user | Change the default for production. |
| `DB_PASSWORD` | `app_pass` | Strong random password | **Change this.** Default is not secure. |
| `DB_NAME` | `app_db` | Your production DB name | |
| `DATABASE_URL` | — | Optional | Only needed for external managed databases (Supabase, Neon, Railway, etc.) that provide a connection string. If not set, constructed from `DB_*` params automatically. |

### Session & Auth

| Variable | Default | Production Value | Notes |
|----------|---------|-----------------|-------|
| `SESSION_SECRET` | `dev-session-secret-...` (dev/test only) | Strong random string | **Required in production.** No default. Generate: `openssl rand -hex 32` |

### CORS

| Variable | Default | Production Value | Notes |
|----------|---------|-----------------|-------|
| `WEB_URL` | `http://localhost:3000` | `https://app.example.com` | Primary frontend URL allowed by CORS. Default is the container-internal port. |
| `CORS_ORIGINS` | — | `https://staging.example.com` | Optional comma-separated list of additional allowed origins. |

---

## Frontend (Web) Variables

Next.js handles frontend environment variables natively — no validation file.

Variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript and visible in the browser. Set them at build time, not runtime.

| Variable | Default | Production Value | Notes |
|----------|---------|-----------------|-------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001` (fallback) | `https://api.example.com` | The API URL the browser uses for requests. If not set, falls back to localhost. |
| `NODE_ENV` | `development` | `production` | Set automatically by the production Docker image. |

---

## Generating Secrets

```bash
# Session secret (64 hex characters)
openssl rand -hex 32

# Database password (32 base64 characters)
openssl rand -base64 24

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## What to Set for Production

Minimum required set:

```bash
NODE_ENV=production
SESSION_SECRET=<generated-random-string>
DB_HOST=<your-db-host>
DB_USER=<your-db-user>
DB_PASSWORD=<strong-password>
DB_NAME=<your-db-name>
WEB_URL=https://app.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
```

If using a managed database with a connection string:

```bash
DATABASE_URL=postgres://user:pass@db.example.com:5432/mydb
```

---

## Development Defaults

In development (using Docker Compose), these are set automatically via `docker-compose.yml`. You generally don't need a `.env` file at all unless you're overriding ports:

```bash
# Only needed if you want to change the default ports
WEB_PORT=3001
API_PORT=4001
DB_PORT=5433
```

`SESSION_SECRET` is automatically set to a dev default in development and test environments, so it doesn't need to be in your `.env`.

---

## Startup Validation Errors

If a required variable is missing, you'll see something like:

```
❌ Environment validation failed:

  SESSION_SECRET:
    - SESSION_SECRET is required

💡 Required environment variables:
  - SESSION_SECRET (required in production)

💡 Optional environment variables:
  - PORT (default: 4000)
  - NODE_ENV (default: development)
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
  - DATABASE_URL (for external database services)
  - WEB_URL (default: http://localhost:3000)
  - CORS_ORIGINS (comma-separated list)
```

---

## Using External Secret Managers

In production, consider managing secrets outside of `.env` files:

| Service | Best For |
|---------|---------|
| AWS Secrets Manager | AWS-hosted deployments |
| Google Secret Manager | GCP-hosted deployments |
| Azure Key Vault | Azure-hosted deployments |
| HashiCorp Vault | Multi-cloud or on-premises |
| Kubernetes Secrets | Kubernetes deployments |

The integration pattern is typically: fetch the secret value at deploy time and inject it as an environment variable into the Docker container.

---

## Next Steps

- **[Docker Deployment](/dashboard/docs/deployment/docker)** — How variables flow through Docker Compose
- **[Production Checklist](/dashboard/docs/deployment/production-checklist)** — What to verify before going live
- **[Environment Security](/dashboard/docs/security/environment)** — Concepts and best practices
