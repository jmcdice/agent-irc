# Project Structure

<!-- AI_CONTEXT
This document explains the monorepo layout and key files.
Key directories: apps/web, apps/api, packages/shared, docker/
Key files: turbo.json, pnpm-workspace.yaml, docker-compose.yml, dev.sh, apps/api/src/env.ts
IMPORTANT: There is no routes/ directory in apps/api. All API routes are defined inline in apps/api/src/index.ts.
IMPORTANT: There is no services/ directory in apps/api.
TypeORM entities are in apps/api/src/entities/ (User, Session, PasswordResetToken).
-->

App Shell uses a **monorepo** structure — one Git repository that contains multiple distinct projects. Rather than maintaining a separate repo for your frontend and another for your backend, everything lives together. This makes it easier to share code between them, run everything with a single command, and keep versions in sync.

The three projects inside are the frontend, the backend, and a small shared package that both of them import from.

## Top-Level Layout

```
app-shell/
├── apps/
│   ├── web/                    # Next.js frontend application
│   └── api/                    # Express backend API
├── packages/
│   └── shared/                 # Types and validation shared between apps
├── docker/                     # Dockerfiles for building each app's image
├── dev.sh                      # Development command runner script
├── docker-compose.yml          # Defines how all services run together in development
├── docker-compose.prod.yml     # Overrides for running the production stack locally
├── turbo.json                  # Build orchestration configuration
├── pnpm-workspace.yaml         # Declares which directories are workspace packages
└── package.json                # Root scripts and shared development dependencies
```

## `apps/web` — The Frontend

```
apps/web/
├── src/
│   ├── app/                    # Pages, organized using Next.js App Router
│   │   ├── dashboard/          # Authenticated routes (require login)
│   │   │   ├── page.tsx        # Dashboard home page
│   │   │   ├── profile/        # User profile and account settings
│   │   │   └── docs/           # In-app documentation (what you're reading now)
│   │   ├── login/              # Login page
│   │   ├── register/           # Account registration page
│   │   └── layout.tsx          # Root HTML shell (applies to all pages)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui component library
│   │   ├── layout/             # Sidebar, header, and dashboard shell
│   │   ├── themes/             # Theme switcher and provider components
│   │   └── docs/               # Markdown renderer and docs navigation components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── styles/                 # Global CSS, Tailwind config, and theme files
│   └── content/
│       └── docs/               # Markdown files that power this documentation
└── package.json
```

### How routing works

Next.js uses **file-based routing**: the folder structure under `app/` maps directly to URLs. A file at `app/dashboard/profile/page.tsx` becomes the page at `/dashboard/profile`. No separate routing configuration is needed — adding a folder creates a route.

### Custom hooks

The `hooks/` directory contains reusable logic that any component can use. React hooks are functions that encapsulate stateful behavior so you don't have to rewrite the same patterns across components. App Shell ships several:

| Hook | What it does |
|------|-------------|
| `use-api` | Makes authenticated API calls and tracks loading and error state |
| `use-permissions` | Returns the current user's role for conditional rendering |
| `use-confirmation` | Manages the "are you sure?" dialog before destructive actions |
| `use-pagination` | Tracks current page and item counts for data tables |
| `use-debounce` | Delays a value update until the user stops typing (useful for search inputs) |

## `apps/api` — The Backend

```
apps/api/
├── src/
│   ├── index.ts                # Application entry point — all routes defined here
│   ├── env.ts                  # Environment variable validation (runs at startup)
│   ├── data-source.ts          # Database connection configuration
│   ├── swagger.ts              # API documentation setup
│   ├── entities/               # Database table definitions (TypeORM)
│   │   ├── User.ts             # User accounts
│   │   ├── Session.ts          # Active login sessions
│   │   └── PasswordResetToken.ts # Temporary tokens for password reset flow
│   ├── middleware/             # Reusable request-processing functions
│   │   ├── auth.ts             # Verifies a request has a valid session
│   │   └── errorHandler.ts     # Catches errors and formats responses consistently
│   ├── utils/                  # Shared utilities
│   │   ├── errors.ts           # ApiError class for structured error responses
│   │   ├── logger.ts           # Structured request logging (Pino)
│   │   ├── cors.ts             # Determines which origins are allowed to make requests
│   │   └── email.ts            # Sends password reset emails
│   ├── scripts/
│   │   └── seed.ts             # Populates the database with sample data
│   └── tests/                  # Test files for API endpoints and middleware
└── package.json
```

### All routes live in `index.ts`

There's no `routes/` subdirectory in the API. All endpoints are defined directly in `index.ts`. This is intentional — App Shell is a starter template, not a production application with hundreds of endpoints, and keeping everything in one file means you can read the entire API in one sitting and understand the full picture. When your project grows large enough that splitting it makes sense, you'll know exactly what you're splitting and why.

### `env.ts` — validation before anything else

`env.ts` is the very first thing the API imports. It reads all environment variables and validates that required ones are present and correctly formatted. If the `DATABASE_URL` is missing, or the `SESSION_SECRET` is absent, the process exits immediately with a clear error before the server even tries to start.

This pattern is called **fail fast**. The alternative — an app that starts up fine and crashes mysteriously the first time it tries to use a misconfigured value — is much harder to debug.

### Database entities

**TypeORM** is the library the API uses to interact with PostgreSQL. Instead of writing raw SQL, you define your database tables as TypeScript classes called **entities**, and TypeORM handles creating the tables, running queries, and mapping results back to objects you can work with in code.

App Shell ships three entities:

- **`User`** — Stores accounts: `id` (UUID), `email` (unique), `name`, `passwordHash`, `avatarUrl`, `role`, and timestamps. The `passwordHash` field is nullable — future authentication methods (like OAuth) might not require a password at all.
- **`Session`** — Stores active login sessions. Managed automatically by the session middleware; you rarely interact with this directly, though you can query it with `./dev.sh db` to see what's there.
- **`PasswordResetToken`** — Stores temporary tokens generated during the forgot-password flow, with a `expiresAt` timestamp and a `usedAt` field that gets set when a token is consumed.

## `packages/shared` — Shared Code

```
packages/shared/
└── src/
    ├── index.ts                # TypeScript type definitions (User, UserRole, etc.)
    └── schemas.ts              # Zod validation schemas
```

This package solves a specific coordination problem: the frontend and backend need to agree on what data looks like. If the API returns a `User` object, both sides should be working from the same definition of what fields a `User` has.

**Zod** is the validation library used here. A Zod schema describes the exact shape of a piece of data — which fields are required, what types they should be, minimum lengths, valid formats, and so on. The same schema can validate incoming request bodies on the backend *and* form inputs on the frontend, so the rules are defined once and applied consistently in both places.

## Key Configuration Files

### `turbo.json`

**Turborepo** is the build system that coordinates tasks across all three packages. When you run `pnpm build`, Turborepo determines the correct order (the `shared` package must compile before `web` and `api`, since they both depend on it), runs things in parallel where possible, and caches results. If you build twice without changing anything, the second build completes almost instantly from cache.

### `pnpm-workspace.yaml`

This file tells pnpm that `apps/*` and `packages/*` are all part of the same workspace. Without it, each package would be an isolated project with no knowledge of the others. With it, `apps/web` can import from `@app-shell/shared` as if it were a published npm package, even though it's just a folder in the same repo.

### `docker-compose.yml`

Defines the three services — `web`, `api`, and `db` — how they connect to each other, what environment variables they receive, and how your local source files get mounted into the containers so that changes are reflected immediately without rebuilding. The `api` service is configured to wait for the `db` health check to pass before starting, so you never get a race condition where the API tries to connect to a database that isn't ready yet.

### `dev.sh`

A shell script that wraps Docker Compose and pnpm commands into friendlier shortcuts with colored output and error checking. The script uses `set -euo pipefail` at the top, which means it exits immediately if any command fails rather than silently continuing — the same fail-fast principle as `env.ts`. Most of your daily interactions with the project go through this script.
