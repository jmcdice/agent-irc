#!/usr/bin/env bash
# scripts/staging.sh - Remote staging deployment via SSH
#
# This script runs inside the Factory worker container and SSHes to a
# remote host to deploy the App Shell application.
#
# Environment variables (set by stagingAgent):
#   BRANCH_NAME       - Git branch being staged
#   REPO_PATH         - Path to the repository (in worker container - not used for remote)
#   PIPELINE_RUN_ID   - UUID of the pipeline run
#   SF_STAGING        - Set to "1" when running from staging agent
#
# Configuration for app-shell deployment:
STAGING_HOST="${STAGING_HOST:-joey@192.168.86.40}"
STAGING_PATH="${STAGING_PATH:-/Users/joey/repos/app-shell}"
SSH_KEY="${SSH_KEY:-/root/.ssh/factory_staging_key}"

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "  App Shell - Remote Staging Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Branch:        ${BRANCH_NAME:-main}"
echo "Pipeline Run:  ${PIPELINE_RUN_ID:-unknown}"
echo "Target Host:   ${STAGING_HOST}"
echo "Target Path:   ${STAGING_PATH}"
echo ""

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "✗ SSH key not found: $SSH_KEY"
    echo "  Make sure docker-compose.yml mounts the SSH key into the worker container."
    exit 1
fi

echo "→ Connecting to ${STAGING_HOST}..."

# Execute deployment commands on remote host
# Use zsh -l (login shell) to ensure /usr/local/bin is in PATH for docker
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$STAGING_HOST" "zsh -l" << ENDSSH
set -euo pipefail

echo "→ Connected to Mac Mini"
cd "${STAGING_PATH}"

# Start ssh-agent and add GitHub key for git operations
echo "→ Setting up SSH agent for GitHub access..."
eval \$(ssh-agent -s) > /dev/null 2>&1
ssh-add ~/.ssh/initialcapacity > /dev/null 2>&1

echo "→ Current branch: \$(git branch --show-current)"
echo "→ Fetching latest from origin..."
git fetch origin

# Check if branch exists (locally or on remote)
if git rev-parse --verify "${BRANCH_NAME:-main}" >/dev/null 2>&1 || \
   git rev-parse --verify "origin/${BRANCH_NAME:-main}" >/dev/null 2>&1; then
    echo "→ Checking out branch: ${BRANCH_NAME:-main}"
    git checkout "${BRANCH_NAME:-main}" 2>/dev/null || git checkout -b "${BRANCH_NAME:-main}" "origin/${BRANCH_NAME:-main}"
    git pull origin "${BRANCH_NAME:-main}"
else
    echo "→ Branch '${BRANCH_NAME:-main}' not found locally or on remote, using current branch"
    git pull
fi

echo ""
echo "→ Building Docker containers..."
./dev.sh build

echo "→ Restarting services..."
./dev.sh down 2>/dev/null || true
./dev.sh up

echo "→ Waiting for services to start..."
sleep 10

echo "→ Running health check..."
for i in {1..6}; do
    if curl -sf http://localhost:4001/healthz > /dev/null 2>&1; then
        echo "✓ API is healthy!"
        break
    fi
    if [ \$i -eq 6 ]; then
        echo "✗ API health check failed after 30 seconds"
        exit 1
    fi
    echo "  Waiting for API... (attempt \$i/6)"
    sleep 5
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  App Shell - Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Access the applications:"
echo "  Web App:  http://\$(hostname):3001"
echo "  API:      http://\$(hostname):4001"
ENDSSH

REMOTE_EXIT=$?

if [ $REMOTE_EXIT -eq 0 ]; then
    echo ""
    echo "✓ Remote deployment to Mac Mini successful!"
else
    echo ""
    echo "✗ Remote deployment failed (exit code: $REMOTE_EXIT)"
    exit $REMOTE_EXIT
fi

