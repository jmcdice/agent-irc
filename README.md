# Agent IRC

A production-ready monorepo starter template for full-stack applications with authentication, database, and modern tooling.

## Overview

Agent IRC provides a solid foundation for building full-stack web applications. It includes a complete authentication system, database integration, and a modern development workflow out of the box.

## Project Structure

```
app-shell/
├── apps/
│   ├── web/          # Next.js frontend (shadcn/ui, Tailwind CSS)
│   └── api/          # Express backend API (TypeORM, PostgreSQL)
├── packages/
│   └── shared/       # Shared types and utilities
└── docker/           # Docker configuration
```

## Features

- 🔐 **Authentication**: Session-based auth with bcrypt password hashing
- 🗄️ **Database**: PostgreSQL with TypeORM
- 🎨 **UI**: Next.js 15, React 19, shadcn/ui, Tailwind CSS
- 🔧 **Dev Tools**: Hot reload, TypeScript, ESLint, Vitest
- 📦 **Monorepo**: pnpm workspaces + Turborepo
- 🐳 **Docker**: Full containerized development environment

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- pnpm 9+ (for local development)

### Quick Start with Docker

```bash
# Start all services (web, api, db)
docker compose up

# Access the application
# Web UI:  http://localhost:3001
# API:     http://localhost:4001
# DB:      postgres://app_user:app_pass@localhost:5433/app_db
```

### Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Start all services in dev mode
pnpm dev

# Or start individual services
cd apps/api && pnpm dev
cd apps/web && pnpm dev
```

## Available Scripts

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps
pnpm test         # Run tests across all packages
pnpm typecheck    # Type check all packages
pnpm lint         # Lint all packages
pnpm clean        # Clean build artifacts
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, shadcn/ui, Tailwind CSS
- **Backend:** Express, TypeORM, PostgreSQL
- **Build:** pnpm workspaces, Turborepo
- **Testing:** Vitest
- **Infrastructure:** Docker Compose

## Customization

This is a template - customize it for your needs:

1. Update package names in `package.json` files
2. Modify the database schema in `apps/api/src/entities`
3. Add your UI components in `apps/web/src/components`
4. Configure environment variables for your deployment

## License

MIT
