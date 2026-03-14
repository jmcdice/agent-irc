# Docker Setup

<!-- AI_CONTEXT
This document explains the Docker configuration for development and production.
Key files: docker-compose.yml, docker-compose.prod.yml, docker/Dockerfile.api, docker/Dockerfile.web, docker/entrypoint-api-dev.sh
Dev: volume mounts for hot reload, entrypoint script re-links pnpm deps and rebuilds shared on container start.
Prod API: 3-stage build (base → builder → prod), pnpm prune --prod, non-root user appuser (uid 1001), dumb-init.
Prod Web: Next.js standalone output mode, copies .next/standalone + .next/static + public.
SESSION_SECRET uses :? syntax in prod compose — fails immediately if not set.
DB port not exposed in production (commented out in docker-compose.prod.yml).
Health checks use wget --spider (curl not installed on alpine).
Related docs: quick-start, deployment/docker, getting-started/dev-commands
-->

Docker is how App Shell runs consistently across different machines. Rather than requiring you to install and configure PostgreSQL, Node.js, and other dependencies in a specific way on your computer, Docker packages each service into a self-contained container that runs the same way everywhere.

## Development vs. Production

The Docker setup has two modes that serve different goals:

**Development** prioritizes speed and flexibility. Your local source files are mounted directly into the containers, so code changes are reflected immediately without rebuilding. The images are larger because they include development tools.

**Production** prioritizes size and security. Images are built in multiple stages to strip out everything that isn't needed to run the app. No source code, no dev dependencies, no build tools — just the compiled output and what it needs to run.

## The Development Setup

`docker-compose.yml` defines three services and how they connect:

```
db ──(healthcheck)──▶ api ──▶ web
```

The `api` service won't start until PostgreSQL reports itself healthy. The `web` service won't start until `api` is up. This ordering prevents the race conditions you'd otherwise get from containers starting simultaneously and immediately trying to connect to things that aren't ready.

### Volume mounts

The key to hot reloading in development is volume mounts — Docker keeps your local files synchronized with the container's filesystem:

```yaml
volumes:
  - ./apps/api:/app/apps/api      # Your source code syncs into the container
  - ./packages:/app/packages       # Shared package source too
  - /app/node_modules              # Container's node_modules (not overwritten)
  - /app/apps/api/node_modules     # Container's package-specific node_modules
```

The `node_modules` entries with no host path are an important detail. Without them, Docker would overwrite the container's installed packages with your local `node_modules` (which might be built for a different OS, or might not exist). These entries tell Docker to keep those directories as container-only volumes, isolated from your host machine.

### The entrypoint script

The API container doesn't start `pnpm dev` directly. It first runs `docker/entrypoint-api-dev.sh`:

```sh
# Re-link dependencies after volume mount (fixes broken symlinks)
pnpm install --frozen-lockfile

# Rebuild shared package so API sees the latest compiled output
cd /app/packages/shared && pnpm build

# Now start the dev server
cd /app/apps/api && exec pnpm dev
```

The reason this is necessary: when Docker mounts your local source files into the container, it breaks pnpm's internal symlinks — the links it creates to wire workspace packages together. Re-running `pnpm install` restores them. Then `packages/shared` is rebuilt to make sure the compiled output in `dist/` matches whatever source you have locally.

This runs every time the API container starts. The first few seconds of startup output you'll see when running `./dev.sh up` are this script doing its work.

## The Production Dockerfiles

Both `Dockerfile.api` and `Dockerfile.web` use **multi-stage builds** — a pattern where a single Dockerfile describes multiple steps, and the final image only contains what's needed for the last step. Each step (`FROM ... AS name`) starts fresh and can selectively copy things from previous steps.

### API: three stages

**Stage 1: `base`** — starts from `node:20-alpine` (a minimal Linux image with Node.js) and installs pnpm. This stage is just setup that both subsequent stages share.

**Stage 2: `builder`** — installs all dependencies (including dev dependencies needed for compilation) and builds the TypeScript source into JavaScript. Critically, it also runs `pnpm prune --prod` at the end, which removes development dependencies from `node_modules` in preparation for the next stage.

**Stage 3: `prod`** — starts fresh from `node:20-alpine` and copies only the compiled output and production `node_modules` from the builder. The source code, TypeScript compiler, and all build tools are left behind.

```dockerfile
# What the prod stage copies from builder:
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
```

This results in a much smaller image — only runnable JavaScript, no source, no compiler.

### Web: standalone mode

The web Dockerfile follows the same pattern, but with an important Next.js-specific detail. The production Next.js build uses **standalone mode**, which produces a self-contained output that includes a minimal Node.js server. This means the production web container doesn't need Next.js itself installed at runtime — just the compiled output.

```dockerfile
# What the prod stage copies for the web:
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
```

The container then starts with `node apps/web/server.js` — the standalone server Next.js generates — rather than running `next start`.

### Security: non-root user

Both production images create a dedicated non-root user before running the application:

```dockerfile
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# ...later...
USER appuser
```

By default, processes in Docker containers run as root. That's convenient but means that if the application is compromised, the attacker has root access inside the container. Running as `appuser` limits the blast radius — the process can only access what it owns.

### Signal handling: dumb-init

Both production images install and use `dumb-init`:

```dockerfile
RUN apk add --no-cache dumb-init
CMD ["dumb-init", "node", "dist/index.js"]
```

When Docker stops a container, it sends a termination signal to process ID 1. If your application is PID 1 and doesn't handle signals properly, the container just gets force-killed after a timeout. `dumb-init` runs as PID 1 and correctly forwards signals to your application, allowing it to shut down gracefully — finishing in-flight requests, closing database connections, etc.

### Health checks

Both production images include health checks that Docker runs automatically:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/healthz || exit 1
```

Every 30 seconds, Docker checks that the service responds. After 3 failures, the container is marked unhealthy. `./dev.sh status:prod` shows you the current health state of each container.

Note that the health check uses `wget --spider` rather than `curl`. `curl` isn't installed on Alpine Linux by default, but `wget` is.

## The Production Compose File

`docker-compose.prod.yml` layers on top of `docker-compose.yml` using Docker Compose's override mechanism. It changes the build target to `prod` for the API and web, removes volume mounts (production uses the built image, not live source files), adds `restart: unless-stopped` so containers recover from crashes, and adds health check configuration.

One security detail worth noting: in the production compose, the database port is commented out:

```yaml
db:
  # ports:
  #   - "5433:5432"
```

In development, the port is exposed so you can connect with `./dev.sh db` or a database GUI. In production, the database should only be reachable from within the Docker network — not from the host machine or the internet.

### Required environment variable

The production API config uses a special syntax for `SESSION_SECRET`:

```yaml
SESSION_SECRET: ${SESSION_SECRET:?SESSION_SECRET is required}
```

The `:?` means Docker Compose will refuse to start if `SESSION_SECRET` is not set in the environment. It won't silently fall back to a default. This is intentional — a missing session secret in production is a misconfiguration that should fail loudly, not quietly proceed with an insecure default.

## Running Production Locally

```bash
# Build production images
./dev.sh build:prod

# Start the production stack
./dev.sh up:prod

# Check health status of all containers
./dev.sh status:prod

# Tear it down
./dev.sh down:prod
```

Running production locally is useful for verifying that your application actually works in the production configuration before deploying it anywhere. Development and production builds can behave differently, and catching that difference locally is much better than discovering it after deployment.
