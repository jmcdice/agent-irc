#!/bin/sh
set -e

echo "=== App Shell API Development Entrypoint ==="

cd /app

# Re-run pnpm install to fix symlinks after volume mounts
echo "[deps] Re-linking dependencies after volume mount..."
pnpm install --frozen-lockfile 2>&1 | tail -5

# Rebuild packages to ensure dist/ is up-to-date with mounted source
echo "[packages] Rebuilding shared packages to sync with mounted source..."

cd /app/packages/shared
if pnpm build 2>&1; then
  echo "[packages] ✓ shared package rebuilt successfully"
else
  echo "[packages] ✗ Warning: shared package build failed (continuing anyway)"
fi

cd /app

# Start the development server
echo "[api] Starting API development server..."
cd /app/apps/api
exec pnpm dev

