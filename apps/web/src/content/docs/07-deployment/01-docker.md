# Docker Deployment

<!-- AI_CONTEXT
This document covers Docker deployment for production.
Key files: docker-compose.yml, docker-compose.prod.yml, docker/Dockerfile.api, docker/Dockerfile.web
IMPORTANT: Correct production commands are ./dev.sh build:prod, ./dev.sh up:prod, ./dev.sh down:prod, ./dev.sh logs:prod, ./dev.sh status:prod (colons, not hyphens).
No nginx service in docker-compose.prod.yml — only web, api, db.
Dockerfile.api: stages are base, dev, builder, prod. prod uses dumb-init, non-root appuser (uid 1001).
Dockerfile.web: stages are base, dev, builder, prod. prod uses Next.js standalone output from .next/standalone.
SESSION_SECRET:?SESSION_SECRET is required (not just ?Required).
DATABASE_URL has a default in prod compose: ${DATABASE_URL:-postgres://app_user:app_pass@db:5432/app_db}.
Health checks: api start_period=10s, web start_period=15s.
Related docs: production-checklist, environment-variables, architecture/docker-setup
-->

## Development vs Production

The development environment and the production environment use the same Docker Compose structure but different image targets and settings.

**Development** (`docker-compose.yml`):
- Uses the `dev` image stage — source code is mounted into the container
- Changes to your files are reflected immediately (hot reload)
- Dev dependencies are installed
- The database port is exposed to your local machine for inspection

**Production** (`docker-compose.yml` + `docker-compose.prod.yml`):
- Uses the `prod` image stage — a separately compiled, minimal image
- No source mounts — code is baked into the image
- Dev dependencies are stripped out
- The database port is **not** exposed externally
- Health checks are configured
- Containers restart automatically if they crash

The `docker-compose.prod.yml` file overrides specific settings from `docker-compose.yml`. You always run both files together.

## Production Commands

```bash
# Build the production images
./dev.sh build:prod

# Build clean (ignore all cached layers)
./dev.sh build:prod --fresh

# Start the production stack
./dev.sh up:prod

# Stop the production stack
./dev.sh down:prod

# Stream production logs
./dev.sh logs:prod

# Stream logs from a specific service
./dev.sh logs:prod api

# Show container status and health check results
./dev.sh status:prod
```

All of these wrap Docker Compose with both compose files applied automatically. You don't need to remember the `-f docker-compose.yml -f docker-compose.prod.yml` flags.

## How the Production Images Are Built

Both Dockerfiles (`docker/Dockerfile.api` and `docker/Dockerfile.web`) use **multi-stage builds**. A multi-stage build uses multiple `FROM` instructions in a single Dockerfile. Each stage produces intermediate output. The final stage copies only what it needs from the earlier stages — leaving behind compilers, build tools, test files, and dev dependencies that have no place in a production image.

### API Image (`Dockerfile.api`)

Three stages:

**`base`** — Installs system tools and pnpm. Everything else builds on top of this.

**`builder`** — A temporary environment that installs all dependencies (including dev ones), compiles TypeScript to JavaScript, then runs `pnpm prune --prod` to strip development packages. This stage exists only to produce the compiled output.

**`prod`** (the final image) — Copies only the compiled JavaScript and production node_modules from `builder`. Also:
- Installs `dumb-init` — a tiny process manager that correctly handles Unix signals inside Docker. Without it, Node.js running as PID 1 doesn't receive SIGTERM properly, which means graceful shutdown doesn't work.
- Creates a non-root user (`appuser`, uid 1001) and runs the process as that user. If the container is ever compromised, the attacker gets a restricted user account rather than root.

```dockerfile
# What the prod stage actually looks like
FROM node:20-alpine AS prod

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/apps/api/dist ./apps/api/dist
# ... other files

USER appuser
EXPOSE 4000

CMD ["dumb-init", "node", "dist/index.js"]
```

### Web Image (`Dockerfile.web`)

Same structure, with one important difference: the production stage uses **Next.js standalone output**.

Next.js can build a self-contained bundle that includes only the parts of Next.js your application actually uses — no `node_modules` directory needed, no full Next.js installation. The output is a single `server.js` file plus a `.next/static` directory. This is what gets copied into the production image, making it significantly smaller.

```dockerfile
FROM node:20-alpine AS prod

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Just the standalone bundle
COPY --from=builder --chown=appuser:appgroup /app/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=appuser:appgroup /app/apps/web/public ./apps/web/public

USER appuser
EXPOSE 3000

CMD ["dumb-init", "node", "apps/web/server.js"]
```

## The Production Compose File

`docker-compose.prod.yml` overrides three services:

**`db`** — Removes the external port mapping. In development, the database is exposed on `localhost:5433` so you can connect to it with `./dev.sh db`. In production, no external access. Adds `restart: unless-stopped`.

**`api`** — Switches to the `prod` build target, removes volume mounts, sets `NODE_ENV=production`, requires `SESSION_SECRET`, and configures a health check:

```yaml
api:
  build:
    target: prod
  restart: unless-stopped
  environment:
    NODE_ENV: production
    SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET is required}
    DATABASE_URL: ${DATABASE_URL:-postgres://app_user:app_pass@db:5432/app_db}
    # ... individual DB params with defaults
  volumes: []  # No source mounts
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/healthz"]
    interval: 30s
    timeout: 10s
    start_period: 10s
    retries: 3
```

The `${SESSION_SECRET:?SESSION_SECRET is required}` syntax is Docker Compose's fail-fast: if `SESSION_SECRET` isn't set, Compose refuses to start and prints the error message. This is the same fail-fast philosophy as `env.ts`.

**`web`** — Switches to `prod` target, removes volume mounts, configures a health check with a slightly longer `start_period` (15s) since Next.js takes longer to initialize.

## Running Locally Before Deploying

Before pushing to a real server, you can run the production stack locally to verify it works:

```bash
# Build the production images
./dev.sh build:prod

# Export your secrets
export SESSION_SECRET=$(openssl rand -hex 32)

# Start everything
./dev.sh up:prod

# Check that containers are healthy
./dev.sh status:prod

# When done
./dev.sh down:prod
```

The `status:prod` command shows container health status — you're looking for `(healthy)` on all services.

## Database Persistence

The database data lives in a named Docker volume (`db-data`), which persists across container restarts. If you run `./dev.sh down:prod`, the containers stop but the data stays. Data is only lost if you explicitly delete the volume.

## Backing Up the Database

```bash
# Export a SQL dump
docker exec app-shell-db pg_dump -U app_user app_db > backup-$(date +%Y%m%d).sql

# Restore from a dump
cat backup-20240115.sql | docker exec -i app-shell-db psql -U app_user app_db
```

Run these from your server, not from the `./dev.sh` wrapper, since they interact with a specific container by name.

## Next Steps

- **[Production Checklist](/dashboard/docs/deployment/production-checklist)** — What to verify before going live
- **[Environment Variables](/dashboard/docs/deployment/environment-variables)** — All variables reference
