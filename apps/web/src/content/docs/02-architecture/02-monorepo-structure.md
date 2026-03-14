# Monorepo Structure

<!-- AI_CONTEXT
This document explains the pnpm workspaces and Turborepo setup.
Key files: pnpm-workspace.yaml, turbo.json, package.json (root)
Related docs: overview, shared-packages
Package names: @app-shell/web, @app-shell/api, @app-shell/shared
Turborepo tasks: build (dependsOn ^build), dev (cache:false, persistent), lint (dependsOn ^lint),
  typecheck (dependsOn ^typecheck), test (dependsOn ^build, cache:false), test:watch (cache:false, persistent), clean (cache:false)
-->

A monorepo is a single Git repository that contains multiple distinct projects. App Shell has three: the Next.js frontend (`apps/web`), the Express API (`apps/api`), and a shared code package (`packages/shared`). Two tools work together to make this practical: **pnpm workspaces** handles package linking and dependency management, and **Turborepo** handles running tasks across packages efficiently.

## pnpm Workspaces

The `pnpm-workspace.yaml` file at the root is just two lines:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

This tells pnpm that every directory under `apps/` and `packages/` is a workspace package. Each one has its own `package.json` with its own dependencies, but they all share a single `node_modules` at the root and can reference each other as if they were published npm packages.

The dependency graph looks like this:

```
@app-shell/web ───┐
                  ├──▶ @app-shell/shared
@app-shell/api ───┘
```

Both the frontend and backend import from `@app-shell/shared`. In each app's `package.json`, that dependency is declared using the workspace protocol:

```json
"@app-shell/shared": "workspace:*"
```

The `workspace:*` syntax tells pnpm "use the local version of this package, whatever version it currently is." This means you're always working with the live source, not a published snapshot. Change something in `packages/shared` and both apps see it immediately after a rebuild.

## Turborepo

Turborepo is the build system that coordinates running tasks across all three packages. Without it, you'd have to know the right order to build things and run commands in each package manually. With it, you just run commands from the root and Turborepo figures everything out.

The configuration lives in `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

The `^` prefix in `dependsOn` is Turborepo's way of saying "run this task in all dependencies first." So `"dependsOn": ["^build"]` means: before building this package, build everything it depends on. Since both `web` and `api` depend on `shared`, `shared` always builds first. `web` and `api` can then build in parallel since neither depends on the other.

`dev` and `test:watch` are marked `persistent: true` because they run indefinitely — they don't complete on their own. `cache: false` on `dev`, `test`, `test:watch`, and `clean` tells Turborepo not to cache those results, since they depend on runtime state that changes.

The `build` task excludes `.next/cache/**` from its cached outputs. Next.js keeps its own build cache in that directory, and including it in Turborepo's cache would cause conflicts.

## Running Commands

From the repository root, commands run across all packages automatically via Turborepo:

```bash
pnpm build        # Build all packages in the correct order
pnpm test         # Run all tests (builds first)
pnpm lint         # Lint all packages
pnpm typecheck    # Type-check all packages
```

To target a specific package, use `--filter`:

```bash
pnpm --filter @app-shell/web dev
pnpm --filter @app-shell/api build
pnpm --filter @app-shell/shared test
```

To add a dependency to a specific package:

```bash
# Add a runtime dependency to the web app
pnpm --filter @app-shell/web add lodash

# Add a dev dependency to the API
pnpm --filter @app-shell/api add -D some-tool

# Add a dev tool at the root (available to all packages)
pnpm add -D -w prettier
```

The `-w` flag on the last command means "add to the workspace root." Root-level packages are typically dev tools shared across all packages, like linters or build tools.

## Build Order and Caching

When you run `pnpm build`, here's the sequence:

1. `@app-shell/shared` builds first — it has no internal dependencies
2. `@app-shell/web` and `@app-shell/api` build in parallel — both depend on `shared`, which is now ready

Turborepo caches the output of each task. If you run `pnpm build` twice without changing anything, the second run completes almost instantly because Turborepo sees that the inputs haven't changed and restores the cached outputs.

To see what Turborepo would do without actually running it:

```bash
turbo run build --dry-run
```

To clear the cache when something seems stale:

```bash
turbo clean
# or manually:
rm -rf node_modules/.cache/turbo
```

## The Volume Mount Symlink Problem

There's one quirk worth knowing about. When Docker mounts your local source files into the API container during development, it overwrites the container's file structure in a way that breaks pnpm's symlinks — the internal links pnpm creates between packages in the workspace get severed.

To handle this, the API container runs an entrypoint script at startup that re-runs `pnpm install` to restore the symlinks, then rebuilds `packages/shared` to make sure the compiled output is current:

```sh
pnpm install --frozen-lockfile
cd /app/packages/shared && pnpm build
```

This happens automatically every time you start the API container. It's why the first few seconds of `./dev.sh up` output shows package-linking activity before the API server actually starts. If you ever see import errors in the API related to `@app-shell/shared`, restarting the container (`./dev.sh restart api`) usually resolves it.
