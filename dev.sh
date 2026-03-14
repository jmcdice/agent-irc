#!/usr/bin/env bash
set -euo pipefail

# App Shell Development Script
# Usage: ./dev.sh <command> [options]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
COMPOSE_PROD_FILE="$SCRIPT_DIR/docker-compose.prod.yml"

# Load .env file if it exists (for port configuration)
if [ -f "$SCRIPT_DIR/.env" ]; then
    # Export only the port variables we care about
    export $(grep -E '^(WEB_PORT|API_PORT|DB_PORT)=' "$SCRIPT_DIR/.env" | xargs)
fi

# Default ports (can be overridden by .env file)
WEB_PORT="${WEB_PORT:-3001}"
API_PORT="${API_PORT:-4001}"
DB_PORT="${DB_PORT:-5433}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Agent IRC - Full-Stack Application${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}→ $1${NC}"; }

# Check for required dependencies
check_deps() {
    local missing=()

    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("docker-compose")
    fi

    if ! command -v pnpm &> /dev/null; then
        missing+=("pnpm")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing[*]}"
        echo "Please install them and try again."
        exit 1
    fi

    print_success "All dependencies found"
}

# Docker compose command helper (development)
dc() {
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" "$@"
    else
        docker-compose -f "$COMPOSE_FILE" "$@"
    fi
}

# Docker compose command helper (production)
dc_prod() {
    if docker compose version &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" "$@"
    else
        docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" "$@"
    fi
}

cmd_help() {
    print_header
    echo ""
    echo "Usage: ./dev.sh <command> [options]"
    echo ""
    echo -e "${YELLOW}Development Commands:${NC}"
    echo "  help              Show this help message"
    echo "  up                Start all services (builds if needed)"
    echo "  down              Stop all services"
    echo "  restart [svc]     Restart services (or specific service)"
    echo "  build [--fresh]   Build Docker containers (--fresh for clean rebuild)"
    echo "  logs [service]    View logs (optionally for specific service)"
    echo "  status            Show status of services"
    echo ""
    echo -e "${YELLOW}Production Commands:${NC}"
    echo "  build:prod        Build production Docker images"
    echo "  up:prod           Start production services"
    echo "  down:prod         Stop production services"
    echo "  logs:prod [svc]   View production logs"
    echo "  status:prod       Show status of production services"
    echo ""
    echo -e "${YELLOW}Development Tools:${NC}"
    echo "  install           Install dependencies locally"
    echo "  lint              Run linting"
    echo "  typecheck         Run TypeScript type checking"
    echo ""
    echo -e "${YELLOW}Testing Commands:${NC}"
    echo "  test              Run all tests once"
    echo "  test:watch        Run tests in watch mode (re-runs on file changes)"
    echo "  test:api          Run only API tests"
    echo "  test:web          Run only web app tests"
    echo "  test:shared       Run only shared package tests"
    echo "  test:coverage     Run tests with coverage report"
    echo "  test:file <path>  Run tests for a specific file"
    echo ""
    echo -e "${YELLOW}Database & Containers:${NC}"
    echo "  shell [service]   Open a shell in a container (default: api)"
    echo "  db                Connect to PostgreSQL database"
    echo "  seed              Seed the database with sample data"
    echo "  reset-db          Reset the database (WARNING: destroys data)"
    echo ""
    echo "Examples:"
    echo -e "  ${GREEN}# Development:${NC}"
    echo "  ./dev.sh up                  # Start dev environment"
    echo "  ./dev.sh logs api            # View API logs"
    echo "  ./dev.sh restart web         # Restart just the web container"
    echo "  ./dev.sh db                  # Open psql shell"
    echo ""
    echo -e "  ${GREEN}# Production:${NC}"
    echo "  ./dev.sh build:prod          # Build optimized production images"
    echo "  ./dev.sh up:prod             # Run production stack locally"
    echo "  ./dev.sh down:prod           # Stop production stack"
    echo ""
    echo -e "  ${GREEN}# Testing:${NC}"
    echo "  ./dev.sh test                # Run all tests"
    echo "  ./dev.sh test:watch          # Watch mode - great during development"
    echo "  ./dev.sh test:api            # Test only the API"
    echo "  ./dev.sh test:coverage       # Generate coverage report"
    echo "  ./dev.sh test:file apps/api/src/tests/auth.test.ts"
    echo ""
}

cmd_build() {
    local fresh=false
    local args=()

    for arg in "$@"; do
        if [ "$arg" = "--fresh" ] || [ "$arg" = "-f" ]; then
            fresh=true
        else
            args+=("$arg")
        fi
    done

    if [ "$fresh" = true ]; then
        print_info "Fresh build: cleaning up old containers and images..."
        dc down --rmi local 2>/dev/null || true
        print_info "Building Docker containers with --no-cache..."
        if [ ${#args[@]} -gt 0 ]; then
            dc build --no-cache "${args[@]}"
        else
            dc build --no-cache
        fi
    else
        print_info "Building Docker containers..."
        if [ ${#args[@]} -gt 0 ]; then
            dc build "${args[@]}"
        else
            dc build
        fi
    fi
    print_success "Build complete!"
    print_info "Tip: Use './dev.sh build --fresh' for a completely clean rebuild"
}

cmd_up() {
    print_info "Starting services..."
    check_deps

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        print_info "Installing dependencies..."
        pnpm install
    fi

    dc up -d "$@"
    print_success "Services started!"
    echo ""
    echo "Access the applications:"
    echo "  Web App:     http://localhost:$WEB_PORT"
    echo "  API:         http://localhost:$API_PORT"
    echo "  PostgreSQL:  localhost:$DB_PORT"
    echo ""
    echo "Run './dev.sh logs' to view logs"
}

cmd_down() {
    print_info "Stopping services..."
    dc down "$@"
    print_success "Services stopped!"
}

cmd_restart() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        print_info "Restarting $service..."
        dc restart "$service"
        print_success "$service restarted!"
    else
        print_info "Restarting all services..."
        dc restart
        print_success "All services restarted!"
    fi
}

cmd_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        dc logs -f "$service"
    else
        dc logs -f
    fi
}

cmd_reset_db() {
    print_warning "This will destroy all data in the database!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Resetting database..."
        dc down -v db
        dc up -d db
        sleep 5
        print_success "Database reset complete!"
        print_info "Restart API to recreate tables: ./dev.sh down && ./dev.sh up"
    else
        print_info "Aborted."
    fi
}

# ============================================================================
# Production Commands
# ============================================================================

cmd_build_prod() {
    print_info "Building production Docker images..."

    local fresh=false
    local args=()

    for arg in "$@"; do
        if [ "$arg" = "--fresh" ] || [ "$arg" = "-f" ]; then
            fresh=true
        else
            args+=("$arg")
        fi
    done

    if [ "$fresh" = true ]; then
        print_info "Fresh production build: cleaning up old images..."
        dc_prod down --rmi local 2>/dev/null || true
        print_info "Building with --no-cache..."
        if [ ${#args[@]} -gt 0 ]; then
            dc_prod build --no-cache "${args[@]}"
        else
            dc_prod build --no-cache
        fi
    else
        if [ ${#args[@]} -gt 0 ]; then
            dc_prod build "${args[@]}"
        else
            dc_prod build
        fi
    fi

    print_success "Production images built!"
    echo ""
    echo "Image sizes:"
    docker images | grep agent-irc | head -10
    echo ""
    print_info "Run './dev.sh up:prod' to start the production stack"
}

cmd_up_prod() {
    print_info "Starting production services..."
    check_deps

    # Check if SESSION_SECRET is set
    if [ -z "${SESSION_SECRET:-}" ]; then
        print_warning "SESSION_SECRET not set. Using default for local testing."
        print_warning "In production, set SESSION_SECRET environment variable!"
        export SESSION_SECRET="dev-session-secret-change-in-production"
    fi

    dc_prod up -d "$@"
    print_success "Production services started!"
    echo ""
    echo "Access the applications:"
    echo "  Web App:     http://localhost:$WEB_PORT"
    echo "  API:         http://localhost:$API_PORT"
    echo ""
    echo "Run './dev.sh logs:prod' to view logs"
    echo "Run './dev.sh status:prod' to check health status"
}

cmd_down_prod() {
    print_info "Stopping production services..."
    dc_prod down "$@"
    print_success "Production services stopped!"
}

cmd_logs_prod() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        dc_prod logs -f "$service"
    else
        dc_prod logs -f
    fi
}

cmd_status_prod() {
    print_header
    echo ""
    echo -e "${YELLOW}Production Stack Status:${NC}"
    echo ""
    dc_prod ps
    echo ""

    # Check container health
    print_info "Container Health:"
    for container in agent-irc-api agent-irc-web agent-irc-db; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
        local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
        if [ "$health" = "healthy" ]; then
            print_success "$container: $status ($health)"
        elif [ "$health" = "unhealthy" ]; then
            print_error "$container: $status ($health)"
        else
            echo "  $container: $status"
        fi
    done
}

# ============================================================================
# Testing Commands
# ============================================================================

cmd_test() {
    print_info "Running all tests..."
    pnpm test "$@"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        print_success "All tests passed!"
    else
        print_error "Some tests failed."
    fi
    return $exit_code
}

cmd_test_watch() {
    print_info "Running tests in watch mode..."
    print_info "Press 'q' to quit, 'a' to run all tests, 'f' to run failed tests"
    pnpm test:watch "$@"
}

cmd_test_api() {
    print_info "Running API tests..."
    pnpm --filter @agent-irc/api test "$@"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        print_success "API tests passed!"
    else
        print_error "API tests failed."
    fi
    return $exit_code
}

cmd_test_web() {
    print_info "Running web app tests..."
    pnpm --filter @agent-irc/web test "$@"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        print_success "Web tests passed!"
    else
        print_error "Web tests failed."
    fi
    return $exit_code
}

cmd_test_shared() {
    print_info "Running shared package tests..."
    pnpm --filter @agent-irc/shared test "$@"
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        print_success "Shared package tests passed!"
    else
        print_error "Shared package tests failed."
    fi
    return $exit_code
}

cmd_test_coverage() {
    print_info "Running tests with coverage..."
    pnpm test -- --coverage "$@"
    print_info "Coverage reports generated in each package's 'coverage' directory"
}

cmd_test_file() {
    local file="${1:-}"
    if [ -z "$file" ]; then
        print_error "Please specify a test file path"
        echo "Example: ./dev.sh test:file apps/api/src/tests/auth.test.ts"
        exit 1
    fi

    # Determine which package the file belongs to
    if [[ "$file" == *"apps/api"* ]]; then
        print_info "Running API test: $file"
        pnpm --filter @agent-irc/api exec vitest run "$file"
    elif [[ "$file" == *"apps/web"* ]]; then
        print_info "Running web test: $file"
        pnpm --filter @agent-irc/web exec vitest run "$file"
    elif [[ "$file" == *"packages/shared"* ]]; then
        print_info "Running shared test: $file"
        pnpm --filter @agent-irc/shared exec vitest run "$file"
    else
        print_error "Could not determine package for file: $file"
        exit 1
    fi
}

cmd_lint() {
    print_info "Running linter..."
    pnpm lint "$@"
}

cmd_typecheck() {
    print_info "Running type checker..."
    pnpm typecheck "$@"
}

cmd_shell() {
    local service="${1:-api}"
    print_info "Opening shell in $service..."
    dc exec "$service" sh
}

cmd_db() {
    print_info "Connecting to PostgreSQL..."
    dc exec db psql -U app_user -d app_db
}

cmd_seed() {
    print_info "Seeding database with sample data..."

    # Check if containers are running
    if ! dc ps --services --filter "status=running" | grep -q "db"; then
        print_error "Database container is not running. Start it with: ./dev.sh up"
        exit 1
    fi

    # Run seed script inside the API container (or locally if API not running)
    if dc ps --services --filter "status=running" | grep -q "api"; then
        dc exec api npx ts-node src/scripts/seed.ts
    else
        # Run locally (requires database to be accessible)
        pnpm --filter @agent-irc/api db:seed
    fi

    print_success "Database seeded!"
}

cmd_install() {
    print_info "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed!"
}

cmd_status() {
    print_header
    echo ""
    dc ps
}

# Main entry point
main() {
    local cmd="${1:-help}"
    shift || true

    case "$cmd" in
        help|--help|-h)
            cmd_help
            ;;
        up|start)
            cmd_up "$@"
            ;;
        down|stop)
            cmd_down "$@"
            ;;
        restart)
            cmd_restart "$@"
            ;;
        build)
            cmd_build "$@"
            ;;
        logs)
            cmd_logs "$@"
            ;;
        status|ps)
            cmd_status
            ;;
        install)
            cmd_install
            ;;
        # Production commands
        build:prod)
            cmd_build_prod "$@"
            ;;
        up:prod)
            cmd_up_prod "$@"
            ;;
        down:prod)
            cmd_down_prod "$@"
            ;;
        logs:prod)
            cmd_logs_prod "$@"
            ;;
        status:prod)
            cmd_status_prod
            ;;
        # Testing commands
        test)
            cmd_test "$@"
            ;;
        test:watch)
            cmd_test_watch "$@"
            ;;
        test:api)
            cmd_test_api "$@"
            ;;
        test:web)
            cmd_test_web "$@"
            ;;
        test:shared)
            cmd_test_shared "$@"
            ;;
        test:coverage)
            cmd_test_coverage "$@"
            ;;
        test:file)
            cmd_test_file "$@"
            ;;
        lint)
            cmd_lint "$@"
            ;;
        typecheck)
            cmd_typecheck "$@"
            ;;
        shell|sh)
            cmd_shell "$@"
            ;;
        db|psql)
            cmd_db
            ;;
        seed)
            cmd_seed
            ;;
        reset-db)
            cmd_reset_db
            ;;
        *)
            print_error "Unknown command: $cmd"
            echo "Run './dev.sh help' for available commands."
            exit 1
            ;;
    esac
}

main "$@"

