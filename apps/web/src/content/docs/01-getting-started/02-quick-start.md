# Quick Start

<!-- AI_CONTEXT
This document covers creating a new project from App Shell and getting it running.
Key files: scripts/create_new_project.sh, dev.sh, docker-compose.yml
Related docs: introduction, project-structure, dev-commands
Primary workflow: run scripts/create_new_project.sh <name> <target-dir>, then cd into the new project.
App Shell itself is a template — users do not build inside it directly.
Default ports: WEB_PORT=3001, API_PORT=4001, DB_PORT=5433
DB port is 5433 (not 5432) to avoid conflicts with local PostgreSQL installations.
dev-login endpoint: POST /api/auth/dev-login — creates admin user if not exists, browser-only due to cookie.
-->

App Shell is a template you keep around and create new projects from — you don't build directly inside it. This page walks through creating your first project and getting it running.

## What You'll Need

- **Docker Desktop** — App Shell runs everything inside Docker containers. That includes the database, the API server, and the web app. This means you don't need to install PostgreSQL or manage any services directly; Docker handles all of that. [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) if you don't have it.
- **Node.js 20 or newer** — Used for local tooling like the package manager. Check your version with `node --version`.
- **pnpm 9 or newer** — The package manager this project uses. If you have Node.js, install it with `npm install -g pnpm`.

## Creating a New Project

### 1. Clone App Shell

```bash
git clone <your-repo-url> app-shell
cd app-shell
```

This is your template. You'll keep this around and leave it untouched — don't start building inside it.

### 2. Create your project

```bash
./scripts/create_new_project.sh my-app ../my-app
```

Replace `my-app` with your project name and `../my-app` with wherever you want the new project to live. The script will show you a preview of everything it's about to change and ask for confirmation before doing anything.

**Project name rules:** lowercase letters, numbers, hyphens, underscores, and dots are allowed. Must start with a letter. Examples: `my-app`, `acme.platform`, `customer_portal`.

Want to see what the script will do without actually running it?

```bash
./scripts/create_new_project.sh --dry-run my-app ../my-app
```

When you confirm, the script:
- Copies the entire template to the new directory (excluding build artifacts and `node_modules`)
- Renames every reference to `app-shell` and `@app-shell` — in package files, Docker configs, source code imports, `dev.sh`, CI/CD config, README, and the login page title — to your project name
- Creates a fresh `CHANGELOG.md`
- Wipes the Git history and creates a clean initial commit so your project starts with a blank slate
- Removes itself from the new project, since it's no longer needed there

By the time it finishes, the new directory contains a project that looks like it was purpose-built with your name from the start.

### 3. Move into your new project

```bash
cd ../my-app
```

Everything from here on happens in your project, not in App Shell.

### 4. Start everything

```bash
./dev.sh up
```

On first run, this installs dependencies and builds the Docker containers before starting — this takes a few minutes. After that, subsequent starts are much faster since Docker caches the build layers.

When everything is ready:

```
✓ Services started!

Access the applications:
  Web App:     http://localhost:3001
  API:         http://localhost:4001
  PostgreSQL:  localhost:5433
```

> **Why port 5433 instead of 5432?** PostgreSQL's default port is 5432. If you have PostgreSQL installed locally on your machine, running the database container on the same port would cause a conflict. App Shell uses 5433 to avoid that — the two can coexist without any configuration.

### 5. Open the app and log in

Navigate to [http://localhost:3001](http://localhost:3001). You'll see the login page with your project's name.

**Register a new account** — Click "Register", fill out the form, and you're in. New accounts get the `user` role by default.

**Or use the development login shortcut** — The API has a special endpoint that creates an admin account and establishes a session in one step, bypassing registration entirely. Because it sets a browser cookie, it needs to be called from the browser, not the terminal. Open your browser's developer console (F12 → Console) and run:

```javascript
fetch('http://localhost:4001/api/auth/dev-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'dev@example.com', name: 'Dev User' })
}).then(() => location.reload())
```

This creates a `dev@example.com` admin account if one doesn't already exist, logs it in, and refreshes the page.

> **Note:** The dev-login endpoint only exists in development. It will not be present in a production build.

### 6. Set up your remote repository

The project already has a Git repository initialized with one commit. Push it to wherever you're hosting your code:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## What's Running

Three Docker containers start when you run `./dev.sh up`:

| Container | What it is | Address |
|-----------|-----------|---------|
| `app-shell-web` | Next.js frontend | http://localhost:3001 |
| `app-shell-api` | Express API | http://localhost:4001 |
| `app-shell-db` | PostgreSQL database | localhost:5433 |

Your local files are mounted directly into the web and API containers, so code changes are reflected immediately without restarting anything. This is called **hot reloading** — the development servers watch for file changes and update automatically.

## Explore the API Docs

Visit [http://localhost:4001/api-docs](http://localhost:4001/api-docs) to see the interactive API documentation. This is a **Swagger UI** — a browser-based interface that lists every API endpoint, describes what each one expects as input, and lets you make real requests directly without writing any code. It's a useful way to understand what the backend does and to test things out.

## Useful Commands

```bash
# Stream logs from all containers
./dev.sh logs

# Stream logs from just the API
./dev.sh logs api

# Stop all containers
./dev.sh down

# Open an interactive PostgreSQL shell to query the database directly
./dev.sh db
```

See [Development Commands](/dashboard/docs/getting-started/dev-commands) for the complete reference.

## Troubleshooting

### A port is already in use

If you see an error about a port being unavailable, something else on your machine is using that port. You can check what's running on a specific port:

```bash
lsof -i :3001   # check the web port
lsof -i :4001   # check the API port
lsof -i :5433   # check the database port
```

Alternatively, override the ports by creating a `.env` file in the project root:

```bash
WEB_PORT=3002
API_PORT=4002
DB_PORT=5434
```

The `dev.sh` script reads this file automatically.

### Database issues

```bash
# Reset the database entirely (will prompt for confirmation — this deletes all data)
./dev.sh reset-db

# Then restart the services
./dev.sh down && ./dev.sh up
```

### Containers in a bad state

If something is behaving unexpectedly after dependency changes or a botched build:

```bash
# Rebuild everything from scratch, ignoring cached layers
./dev.sh build --fresh
./dev.sh up
```
