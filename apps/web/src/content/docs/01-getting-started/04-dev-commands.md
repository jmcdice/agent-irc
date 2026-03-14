# Development Commands

<!-- AI_CONTEXT
This document is a complete reference for the dev.sh script.
Key file: dev.sh
Related docs: quick-start, project-structure
Default ports: WEB_PORT=3001, API_PORT=4001, DB_PORT=5433
Ports can be overridden via a .env file in the project root.
Command aliases: up=start, down=stop, status=ps, shell=sh, db=psql
test:file auto-detects which package a file belongs to based on its path.
reset-db prompts for confirmation before destroying data.
./dev.sh up auto-runs pnpm install if node_modules is missing.
-->

`dev.sh` is the script you'll use for almost everything — starting the app, running tests, checking logs, and managing the database. It wraps Docker Compose and pnpm commands into named shortcuts with colored output, dependency checking, and useful error messages.

```bash
./dev.sh <command> [options]
```

Run `./dev.sh help` at any time to see the full command list with examples.

---

## Starting and Stopping

```bash
./dev.sh up          # Start all services
./dev.sh down        # Stop all services
./dev.sh restart     # Restart all services
./dev.sh restart api # Restart only the API container
./dev.sh restart web # Restart only the web container
```

**Aliases:** `up` also accepts `start`; `down` also accepts `stop`.

When you run `./dev.sh up` for the first time — or any time `node_modules` doesn't exist — it automatically runs `pnpm install` before starting the containers. You don't need to install dependencies separately.

---

## Logs

```bash
./dev.sh logs        # Stream logs from all containers
./dev.sh logs api    # Stream logs from the API only
./dev.sh logs web    # Stream logs from the frontend only
./dev.sh logs db     # Stream logs from the database only
```

Press `Ctrl+C` to stop following logs. This detaches from the log stream but does not stop the containers.

---

## Status

```bash
./dev.sh status      # Show all containers and their current state
```

**Alias:** `status` also accepts `ps`.

---

## Building

```bash
./dev.sh build           # Rebuild Docker images (uses cached layers where possible)
./dev.sh build --fresh   # Rebuild entirely from scratch, ignoring all cached layers
```

Docker caches each step of the build process, so most rebuilds are fast. Use `--fresh` when a build is behaving unexpectedly — for example, after major dependency changes or when cached layers have gone stale.

---

## Database

```bash
./dev.sh db          # Open an interactive PostgreSQL shell
./dev.sh seed        # Populate the database with sample data
./dev.sh reset-db    # Wipe all data and reset the database
```

**Alias:** `db` also accepts `psql`.

`./dev.sh db` drops you directly into `psql` — the PostgreSQL command-line shell — connected to the app database. You can run SQL queries, inspect table contents, and check what's actually stored. This is useful when debugging data issues or verifying that something saved correctly.

`./dev.sh reset-db` is destructive — it wipes all data and cannot be undone. The script will prompt `Are you sure? (y/N)` before doing anything. After resetting, restart the services so the API can recreate the database tables:

```bash
./dev.sh down && ./dev.sh up
```

`./dev.sh seed` runs a script that populates the database with sample data. It tries to run the seed script inside the API container if it's running, and falls back to running it locally otherwise.

---

## Testing

App Shell uses **Vitest** as the testing framework. Vitest is fast, TypeScript-native, and has a similar API to Jest if you've used that before.

```bash
./dev.sh test              # Run all tests across all packages, once
./dev.sh test:watch        # Run tests in watch mode — reruns automatically when files change
./dev.sh test:api          # Run only the API tests
./dev.sh test:web          # Run only the frontend tests
./dev.sh test:shared       # Run only the shared package tests
./dev.sh test:coverage     # Run all tests and generate code coverage reports
./dev.sh test:file <path>  # Run a specific test file
```

`test:file` automatically figures out which package a given file belongs to based on its path, so you don't need to specify the package manually:

```bash
./dev.sh test:file apps/api/src/tests/auth.test.ts
./dev.sh test:file apps/web/src/hooks/__tests__/use-api.test.ts
```

Coverage reports are generated per-package in each package's `coverage/` directory after running `test:coverage`.

---

## Code Quality

```bash
./dev.sh lint        # Run ESLint across all packages
./dev.sh typecheck   # Run TypeScript type checking across all packages
./dev.sh install     # Install or update all dependencies
```

**ESLint** is a tool that analyzes your code for problems — syntax errors, bad patterns, and style issues — without running it. **TypeScript type checking** (`typecheck`) verifies that the types in your code are consistent, catching a different class of bugs that linting doesn't cover. Running both is a good habit before committing or deploying.

ESLint also runs automatically before each Git commit via **Husky**, a tool that hooks into Git events. If linting fails, the commit is blocked until the issues are fixed. This keeps the codebase consistently clean without relying on everyone to remember to run it manually.

---

## Production Commands

These commands build and run the production-optimized version of the app locally. This is useful for verifying that the production build works before deploying to a real server.

```bash
./dev.sh build:prod          # Build production Docker images
./dev.sh build:prod --fresh  # Clean production build from scratch
./dev.sh up:prod             # Start the production stack
./dev.sh down:prod           # Stop the production stack
./dev.sh logs:prod           # Stream logs from the production stack
./dev.sh logs:prod api       # Stream logs from a specific production service
./dev.sh status:prod         # Show container status and health check results
```

Production images are built with multi-stage Dockerfiles that produce significantly smaller, more secure images than development ones. Development tooling, source maps, and build dependencies are excluded from the final image.

`status:prod` also runs health checks against the running containers, showing whether each one is healthy, unhealthy, or in an unknown state.

---

## Container Shells

```bash
./dev.sh shell       # Open a shell inside the API container
./dev.sh shell web   # Open a shell inside the web container
```

**Alias:** `shell` also accepts `sh`.

This opens an interactive `sh` session inside the running container. Useful for inspecting the filesystem as the container sees it, running one-off scripts, or checking what environment variables are set inside the container. Exit with `Ctrl+D` or by typing `exit`.

---

## Port Overrides

The default ports are:

| Service | Default Port |
|---------|-------------|
| Web (Next.js) | 3001 |
| API (Express) | 4001 |
| PostgreSQL | 5433 |

If any of these conflict with something else on your machine, create a `.env` file in the project root to override them:

```bash
WEB_PORT=3002
API_PORT=4002
DB_PORT=5434
```

`dev.sh` reads this file automatically at startup and passes the values through to Docker Compose.

---

## Common Workflows

**Starting a development session**

```bash
./dev.sh up
./dev.sh logs        # Watch for errors during startup
```

**Running tests while developing**

```bash
# In a separate terminal window while the dev environment is running:
./dev.sh test:watch
```

Tests run in watch mode will rerun automatically whenever you save a file, giving you fast feedback as you work.

**Debugging an API issue**

```bash
./dev.sh logs api    # See what the API is logging
./dev.sh db          # Query the database directly
./dev.sh shell api   # Open a shell inside the container if you need to dig deeper
```

**Verifying the production build before deploying**

```bash
./dev.sh build:prod
./dev.sh up:prod
./dev.sh status:prod
```
