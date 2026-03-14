# Next.js Overview

<!-- AI_CONTEXT
This document explains the Next.js frontend application structure.
Key files: apps/web/src/app/, apps/web/next.config.ts
Framework: Next.js 15 with App Router, React 19, Tailwind CSS, shadcn/ui
The frontend calls the API directly via fetch with credentials:include — there is NO Next.js API proxy.
NEXT_PUBLIC_API_URL defaults to http://localhost:4001 if not set.
Special Next.js files present: error.tsx, global-error.tsx, not-found.tsx, loading.tsx
Dashboard has a components showcase at /dashboard/components
Related docs: components, hooks, theming, state-management
-->

The frontend is a **Next.js 15** application using the App Router and **React 19**. If you've built web apps before, some things here will look familiar; if you haven't, this page will orient you to how the pieces fit together.

## What Next.js Does

Next.js is a framework built on top of React. React is a library for building user interfaces — it gives you a way to break your UI into reusable components. Next.js adds everything else a real application needs: routing (what URL shows what page), build optimization, fonts, environment variable handling, and more.

App Shell uses Next.js 15's **App Router**, which is the current recommended approach. The App Router organizes pages and layouts as a folder structure, with special file names that Next.js recognizes and handles automatically.

## App Structure

```
apps/web/src/app/
├── layout.tsx              # Root layout — wraps every page
├── page.tsx                # Root page (/)
├── error.tsx               # Error boundary — catches rendering errors
├── global-error.tsx        # Top-level error boundary (catches layout errors)
├── not-found.tsx           # 404 page
├── login/
│   └── page.tsx            # Login page
├── register/
│   └── page.tsx            # Registration page
├── forgot-password/
│   └── page.tsx            # Password reset request
├── reset-password/
│   └── page.tsx            # Password reset form
└── dashboard/
    ├── layout.tsx          # Dashboard layout (auth check, sidebar, header)
    ├── page.tsx            # Dashboard home
    ├── loading.tsx         # Loading state shown while dashboard fetches data
    ├── profile/
    │   └── page.tsx        # User profile and account settings
    ├── settings/
    │   └── page.tsx        # Application settings
    ├── components/
    │   └── page.tsx        # Live component showcase (see below)
    └── docs/
        ├── page.tsx        # Documentation index
        ├── layout.tsx      # Documentation layout (sidebar navigation)
        └── [...slug]/
            └── page.tsx    # Individual doc pages (catch-all route)
```

### File-based routing

Next.js turns the folder structure into URLs automatically. A file at `app/dashboard/profile/page.tsx` becomes the page at `/dashboard/profile`. No routing configuration needed — adding a folder creates a route.

### Special file names

Next.js recognizes certain file names and treats them differently:

- **`layout.tsx`** — Wraps all pages in the same directory (and subdirectories). The root layout wraps every page in the app; the dashboard layout wraps every dashboard page with the sidebar and auth check.
- **`page.tsx`** — The actual page content for a route.
- **`loading.tsx`** — A loading state React shows while the page is fetching data.
- **`error.tsx`** — An error boundary that catches failures in page rendering and shows a fallback instead of a blank screen.
- **`not-found.tsx`** — The 404 page, shown when a route doesn't exist.

### The catch-all route

The docs system uses `[...slug]` — a catch-all route that matches any path. `/dashboard/docs/getting-started/quick-start`, `/dashboard/docs/architecture/overview`, and every other doc URL are all handled by a single `[...slug]/page.tsx` file, which reads the URL segments and serves the corresponding markdown file.

## Layouts

### Root layout (`app/layout.tsx`)

Every page in the app is wrapped by the root layout, which sets up:

- **`ThemeProvider`** — Makes the current theme available to all components
- **Fonts** — Geist Sans and Geist Mono, loaded from Google Fonts via Next.js's optimized font system
- **Sonner** — The toast notification library, mounted once here so any page can trigger toasts

### Dashboard layout (`app/dashboard/layout.tsx`)

Pages under `/dashboard` use the dashboard layout, which:

- Checks if the user is authenticated by calling `/api/me`
- Redirects to `/login` if the session is invalid or missing
- Renders the sidebar, sticky header, and main content area around the page

This means individual dashboard pages don't need to handle their own auth checks — the layout gate takes care of it.

## Server Components vs Client Components

This is one of the more important concepts in modern Next.js, and worth understanding even if you're not writing code yourself.

In React, a **Server Component** runs on the server when a user requests a page. The server renders it to HTML and sends that HTML to the browser. The user sees content immediately — no JavaScript needs to load first. Server Components are the default in the App Router.

A **Client Component** runs in the browser. It can respond to user interactions, maintain state (like a form value or a toggle), and update the page without a full reload. You mark a file as a client component with `'use client'` at the top.

```tsx
// Server Component — no 'use client' needed
// Renders to HTML on the server, no browser interactivity
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}
```

```tsx
'use client';

// Client Component — runs in the browser, can be interactive
export function SearchInput() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

In App Shell, pages are generally server components (they just render layout and hand off to client components for interactivity), while forms, data tables, and anything that calls the API are client components.

## How the Frontend Talks to the API

The frontend calls the Express API directly using `fetch`. There's no proxy — requests go straight from the browser to the API.

```
Browser → http://localhost:4001/api/me
```

The `NEXT_PUBLIC_API_URL` environment variable controls where the frontend looks for the API (defaults to `http://localhost:4001`). Every API call includes `credentials: 'include'`, which tells the browser to send the session cookie automatically.

The `NEXT_PUBLIC_` prefix is important: Next.js only exposes environment variables with that prefix to the browser. Server-only secrets (anything without the prefix) are never included in the JavaScript the browser downloads.

## The Component Showcase

There's a live component showcase at `/dashboard/components` that renders every UI component in the library with real examples — buttons in every variant, form elements, overlays, data tables, and more. It's useful for seeing what's available and how things look in the current theme before using a component in your own pages.

## Commands

```bash
# Start the frontend dev server (usually via ./dev.sh up instead)
pnpm --filter @app-shell/web dev

# Build for production
pnpm --filter @app-shell/web build

# Type check
pnpm --filter @app-shell/web typecheck
```
