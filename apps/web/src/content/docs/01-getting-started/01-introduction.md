# Introduction

<!-- AI_CONTEXT
This document introduces App Shell and its purpose.
Key files: package.json, apps/web, apps/api, packages/shared, docker-compose.yml, scripts/create_new_project.sh
Related docs: quick-start, project-structure, architecture/overview
App Shell is a template — users run scripts/create_new_project.sh to create a new project from it. They do not build inside App Shell directly.
Read this first to understand scope and technology choices.
-->

Every web application needs the same foundation before it can do anything interesting: users need to be able to log in, passwords need to be stored safely, sessions need to be tracked across requests, the frontend needs a way to talk to the backend, and all of it needs to run consistently across different machines. Building that foundation from scratch takes a week — sometimes more — before you've written a single line of actual product code.

App Shell is that foundation, already built.

It's a full-stack starter template: a working web application with authentication, a database, an API, and a modern frontend, all pre-configured and running with a single command. You fork it, rename things to match your project, and start building features immediately.

## What's Inside

App Shell is organized as a **monorepo** — a single repository that contains multiple related projects living side by side. Think of it as one folder that holds all three parts of your application:

- **`apps/web`** — The frontend. A Next.js application with a dashboard layout, login and registration pages, a full component library, and a theming system. Next.js is one of the most widely-used frameworks for building React web apps; it handles routing, server rendering, and build optimization out of the box.

- **`apps/api`** — The backend. An Express server that handles user accounts, login sessions, and password flows. It connects to a PostgreSQL database and exposes a REST API — a set of URLs your frontend calls to read and write data. Express is a lightweight, well-established framework for building APIs in Node.js.

- **`packages/shared`** — A small package that both the frontend and backend import. It contains shared type definitions and data validation rules. When the API says it returns a `User` object, and the frontend expects to receive one, both are working from the same definition in this package.

All three run together in Docker containers during development, so you don't need to install a database or configure anything on your local machine beyond Docker itself.

## What's Already Built

### Authentication

Registration, login, and logout are fully implemented. Passwords are hashed with **bcrypt** before being stored — bcrypt is an algorithm specifically designed for passwords that makes them computationally expensive to reverse, even if someone gets a copy of the database. Sessions are stored in PostgreSQL, which means they survive API restarts and can be queried directly if you need to debug them.

### Session Management

Users can see every active session across all their devices and browsers — and revoke any of them individually or all at once. This is the kind of account security feature that often gets cut as "nice to have" in early builds. It's already here.

### Password Reset

A complete forgot-password / reset-password flow. When a user requests a reset, the API generates a cryptographically secure random token, stores it with a one-hour expiration, and sends an email with a link. One intentional security detail: if the submitted email doesn't match any account, the API responds with the same success message it would send if it did. This prevents someone from using the forgot-password form to find out which email addresses are registered.

### Role-Based Access Control

Users have a `role` field — either `user` or `admin`. The backend has middleware (reusable request-processing logic) to restrict specific API endpoints to admins only. The frontend has a `usePermissions` hook and a `RequireRole` component to show or hide UI elements based on the current user's role without writing the same conditional logic everywhere.

### Component Library

30+ pre-installed UI components from shadcn/ui — buttons, modals, dropdowns, data tables, forms, alerts, and more. These are production-quality components you can use directly or customize.

### Theming

A multi-theme system with light and dark mode support. Themes are built on CSS custom properties, which means switching themes changes colors across the entire application without touching individual components.

### API Documentation

The API comes with interactive documentation built in, available at `http://localhost:4001/api-docs` when running locally. Every endpoint is listed with its expected inputs, possible responses, and a form to make live requests from the browser.

## How It Works

App Shell is a template, not a project you build inside. The intended workflow is:

1. **Keep App Shell as-is** — clone it once and leave it alone. It's your source of truth.
2. **Create a new project from it** — run a single script that copies the template to a new directory, renames everything to match your project name, and sets up a fresh Git repository.
3. **Build in your new project** — the generated project is completely independent. App Shell stays untouched so you can create more projects from it later.

The script that handles this is `scripts/create_new_project.sh`. You give it a project name and a destination directory:

```bash
./scripts/create_new_project.sh my-app ../my-app
```

It copies the entire template, replaces every reference to `app-shell` and `@app-shell` with your project name across all package files, Docker configs, source code, and even the login page title, then creates a clean Git history with a single initial commit. By the time it finishes, you have a project that looks like it was never called App Shell. The script also removes itself from the new project since it's no longer needed there.

See the [Quick Start](/dashboard/docs/getting-started/quick-start) for the step-by-step.

## Who It's For

App Shell is for anyone who wants to build a web application without spending the first week on plumbing. That includes:

- **Developers** who've built auth from scratch before and have no interest in doing it again
- **Product managers and vibe coders** who are building with AI assistance and want a solid, well-documented foundation to work from
- **Teams** who want consistent architecture across projects

The codebase is intentionally straightforward and thoroughly documented so that anyone — including an AI assistant helping you write code — can navigate it without getting lost.

## What It Isn't

App Shell is a starting point, not a framework. You get all the source code and own it completely. There's no hidden runtime, no configuration API to learn, no "ejecting" process. When you need something to behave differently, you change the code. That's it.

## Next Steps

- **[Quick Start](/dashboard/docs/getting-started/quick-start)** — Get it running locally in a few minutes
- **[Project Structure](/dashboard/docs/getting-started/project-structure)** — Understand what's where and why
- **[Architecture Overview](/dashboard/docs/architecture/overview)** — How the pieces connect
