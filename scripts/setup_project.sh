#!/usr/bin/env bash
# scripts/setup_project.sh - Setup project for Factory coding agent
#
# This script runs immediately after git clone, before any agents execute.
# It ensures dependencies are installed so tests/typecheck/lint can run.
#
# Supports: Debian/Ubuntu, Alpine Linux
# Requirements: bash, curl or wget

set -euo pipefail

# Configuration
REQUIRED_NODE_MAJOR=20
PNPM_VERSION="9.15.0"

# Colors for output (disabled if not a terminal)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

#######################################
# Print a status message
#######################################
info() {
    echo -e "${BLUE}→${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1" >&2
}

die() {
    error "$1"
    exit 1
}

#######################################
# Detect OS type
#######################################
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS_ID="${ID:-unknown}"
        OS_ID_LIKE="${ID_LIKE:-$OS_ID}"
    elif [[ -f /etc/alpine-release ]]; then
        OS_ID="alpine"
        OS_ID_LIKE="alpine"
    else
        OS_ID="unknown"
        OS_ID_LIKE="unknown"
    fi
}

#######################################
# Check if running as root
#######################################
is_root() {
    [[ $EUID -eq 0 ]]
}

#######################################
# Get the appropriate sudo command
#######################################
get_sudo() {
    if is_root; then
        echo ""
    elif command -v sudo &> /dev/null; then
        echo "sudo"
    else
        echo ""
    fi
}

#######################################
# Download a file using curl or wget
#######################################
download() {
    local url="$1"
    local output="${2:-}"

    if command -v curl &> /dev/null; then
        if [[ -n "$output" ]]; then
            curl -fsSL --retry 3 --retry-delay 2 "$url" -o "$output"
        else
            curl -fsSL --retry 3 --retry-delay 2 "$url"
        fi
    elif command -v wget &> /dev/null; then
        if [[ -n "$output" ]]; then
            wget -q --tries=3 "$url" -O "$output"
        else
            wget -qO- --tries=3 "$url"
        fi
    else
        return 1
    fi
}

#######################################
# Ensure curl or wget is available
#######################################
ensure_downloader() {
    if command -v curl &> /dev/null || command -v wget &> /dev/null; then
        return 0
    fi

    info "Installing curl..."
    local sudo_cmd
    sudo_cmd=$(get_sudo)

    detect_os
    case "$OS_ID" in
        alpine)
            $sudo_cmd apk add --no-cache curl || die "Failed to install curl"
            ;;
        debian|ubuntu)
            $sudo_cmd apt-get update -qq && $sudo_cmd apt-get install -y -qq curl || die "Failed to install curl"
            ;;
        *)
            if [[ "$OS_ID_LIKE" == *"debian"* ]]; then
                $sudo_cmd apt-get update -qq && $sudo_cmd apt-get install -y -qq curl || die "Failed to install curl"
            else
                die "Cannot install curl: unsupported OS ($OS_ID). Please install curl or wget manually."
            fi
            ;;
    esac

    success "curl installed"
}

#######################################
# Get current Node.js major version
#######################################
get_node_version() {
    if command -v node &> /dev/null; then
        node --version | sed 's/v//' | cut -d. -f1
    else
        echo "0"
    fi
}


#######################################
# Install Node.js
#######################################
install_nodejs() {
    local current_version
    current_version=$(get_node_version)

    if [[ "$current_version" -ge "$REQUIRED_NODE_MAJOR" ]]; then
        success "Node.js v$(node --version | sed 's/v//') already installed"
        return 0
    fi

    if [[ "$current_version" -gt 0 ]]; then
        warn "Node.js v$current_version found, but v$REQUIRED_NODE_MAJOR+ required"
    fi

    info "Installing Node.js ${REQUIRED_NODE_MAJOR}.x..."

    detect_os
    local sudo_cmd
    sudo_cmd=$(get_sudo)

    case "$OS_ID" in
        alpine)
            $sudo_cmd apk add --no-cache nodejs npm || die "Failed to install Node.js on Alpine"
            ;;
        debian|ubuntu)
            # Install prerequisites
            $sudo_cmd apt-get update -qq
            $sudo_cmd apt-get install -y -qq ca-certificates gnupg || die "Failed to install prerequisites"

            # Add NodeSource repository
            $sudo_cmd mkdir -p /etc/apt/keyrings
            download "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" "/tmp/nodesource.gpg.key"
            $sudo_cmd gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg < /tmp/nodesource.gpg.key
            rm -f /tmp/nodesource.gpg.key

            echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${REQUIRED_NODE_MAJOR}.x nodistro main" | \
                $sudo_cmd tee /etc/apt/sources.list.d/nodesource.list > /dev/null

            $sudo_cmd apt-get update -qq
            $sudo_cmd apt-get install -y -qq nodejs || die "Failed to install Node.js"
            ;;
        *)
            if [[ "$OS_ID_LIKE" == *"debian"* ]]; then
                # Treat as Debian-like
                $sudo_cmd apt-get update -qq
                $sudo_cmd apt-get install -y -qq ca-certificates gnupg || die "Failed to install prerequisites"

                $sudo_cmd mkdir -p /etc/apt/keyrings
                download "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" "/tmp/nodesource.gpg.key"
                $sudo_cmd gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg < /tmp/nodesource.gpg.key
                rm -f /tmp/nodesource.gpg.key

                echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${REQUIRED_NODE_MAJOR}.x nodistro main" | \
                    $sudo_cmd tee /etc/apt/sources.list.d/nodesource.list > /dev/null

                $sudo_cmd apt-get update -qq
                $sudo_cmd apt-get install -y -qq nodejs || die "Failed to install Node.js"
            else
                die "Unsupported OS ($OS_ID). Please install Node.js ${REQUIRED_NODE_MAJOR}.x manually."
            fi
            ;;
    esac

    # Verify installation
    local new_version
    new_version=$(get_node_version)
    if [[ "$new_version" -lt "$REQUIRED_NODE_MAJOR" ]]; then
        die "Node.js installation failed. Expected v${REQUIRED_NODE_MAJOR}+, got v${new_version}"
    fi

    success "Node.js v$(node --version | sed 's/v//') installed"
}

#######################################
# Install pnpm
#######################################
install_pnpm() {
    # Check if pnpm is already installed with correct version
    if command -v pnpm &> /dev/null; then
        local current_pnpm
        current_pnpm=$(pnpm --version 2>/dev/null || echo "0.0.0")
        if [[ "$current_pnpm" == "$PNPM_VERSION"* ]]; then
            success "pnpm v${current_pnpm} already installed"
            return 0
        fi
        warn "pnpm v${current_pnpm} found, upgrading to v${PNPM_VERSION}"
    fi

    info "Installing pnpm v${PNPM_VERSION}..."

    # Method 1: Try corepack (preferred)
    if command -v corepack &> /dev/null; then
        info "Using corepack to install pnpm..."
        if corepack enable 2>/dev/null && corepack prepare "pnpm@${PNPM_VERSION}" --activate 2>/dev/null; then
            success "pnpm installed via corepack"
            return 0
        fi
        warn "corepack method failed, trying alternatives..."
    fi

    # Method 2: Try npm global install
    if command -v npm &> /dev/null; then
        info "Using npm to install pnpm..."
        local sudo_cmd
        sudo_cmd=$(get_sudo)
        if $sudo_cmd npm install -g "pnpm@${PNPM_VERSION}" 2>/dev/null; then
            success "pnpm installed via npm"
            return 0
        fi
        warn "npm method failed, trying direct install..."
    fi

    # Method 3: Direct install script
    info "Using standalone installer..."
    if download "https://get.pnpm.io/install.sh" | PNPM_VERSION="$PNPM_VERSION" sh - 2>/dev/null; then
        # Add to PATH for current session
        export PNPM_HOME="${HOME}/.local/share/pnpm"
        export PATH="$PNPM_HOME:$PATH"
        success "pnpm installed via standalone installer"
        return 0
    fi

    die "Failed to install pnpm. Please install it manually: npm install -g pnpm@${PNPM_VERSION}"
}


#######################################
# Verify all tools are working
#######################################
verify_installation() {
    info "Verifying installation..."

    local node_version pnpm_version

    if ! command -v node &> /dev/null; then
        die "Node.js verification failed: command not found"
    fi
    node_version=$(node --version)

    if ! command -v pnpm &> /dev/null; then
        die "pnpm verification failed: command not found"
    fi
    pnpm_version=$(pnpm --version)

    echo ""
    echo "  Node.js: ${node_version}"
    echo "  pnpm:    v${pnpm_version}"
    echo ""

    success "All tools verified"
}

#######################################
# Install project dependencies
#######################################
install_dependencies() {
    info "Installing project dependencies..."

    if [[ ! -f "pnpm-lock.yaml" ]]; then
        die "pnpm-lock.yaml not found. Are you in the project root directory?"
    fi

    if ! pnpm install --frozen-lockfile; then
        die "Failed to install dependencies"
    fi

    success "Dependencies installed"
}

#######################################
# Main
#######################################
main() {
    echo "═══════════════════════════════════════════════════════════"
    echo "  App Shell - Project Setup"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    # Step 1: Ensure we have a download tool
    ensure_downloader

    # Step 2: Install/verify Node.js
    install_nodejs

    # Step 3: Install/verify pnpm
    install_pnpm

    # Step 4: Verify everything works
    verify_installation

    # Step 5: Install project dependencies
    install_dependencies

    echo ""
    echo "═══════════════════════════════════════════════════════════"
    success "Project setup complete!"
    echo "  Ready for: pnpm test, pnpm typecheck, pnpm lint"
    echo "═══════════════════════════════════════════════════════════"
}

main "$@"