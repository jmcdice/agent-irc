#!/bin/bash
set -e

echo "=== App Shell Worker Development Entrypoint ==="

cd /app

# Re-run pnpm install to fix symlinks after volume mounts
echo "[deps] Re-linking dependencies after volume mount..."
pnpm install --frozen-lockfile 2>&1 | tail -5

# Rebuild packages to pick up any changes from mounted volumes
echo "[packages] Building shared packages..."
pnpm --filter @se-command-center/shared build

# Run the worker in development mode
echo "[worker] Starting worker..."
exec pnpm --filter @se-command-center/worker dev

