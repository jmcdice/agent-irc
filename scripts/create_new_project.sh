#!/usr/bin/env bash
# scripts/create_new_project.sh - Create a new project from the App Shell template
#
# This script creates a NEW project directory from the App Shell template by:
# - Copying the template to a new directory
# - Replacing all "app-shell" and "@app-shell" references with your project name
# - Initializing a fresh Git repository with an initial commit
# - Cleaning up template-specific files
#
# The original App Shell template remains untouched.
#
# Usage: ./scripts/create_new_project.sh [OPTIONS] <project-name> <target-directory>
#
# Examples:
#   ./scripts/create_new_project.sh my-awesome-app ../my-awesome-app
#   ./scripts/create_new_project.sh my-app ~/projects/my-app
#   ./scripts/create_new_project.sh --dry-run my-app /tmp/my-app

set -euo pipefail

# Get script directory and template root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# This will be set to the new project directory
PROJECT_ROOT=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Disable colors if not a terminal
if [[ ! -t 1 ]]; then
    RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' NC=''
fi

#######################################
# Output helpers
#######################################
print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  App Shell → New Project Initializer${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}→${NC} $1"; }
print_step() { echo -e "${CYAN}[$1/$TOTAL_STEPS]${NC} $2"; }

#######################################
# Validation helpers
#######################################
validate_project_name() {
    local name="$1"

    # Check if empty
    if [[ -z "$name" ]]; then
        print_error "Project name cannot be empty"
        return 1
    fi

    # Check length
    if [[ ${#name} -gt 214 ]]; then
        print_error "Project name must be less than 214 characters"
        return 1
    fi

    # Check for valid npm package name format
    # Must be lowercase, can contain hyphens and underscores, must start with letter or @
    if ! [[ "$name" =~ ^[a-z@][a-z0-9._-]*$ ]]; then
        print_error "Project name must be lowercase and can only contain letters, numbers, hyphens, underscores, and dots"
        print_error "Must start with a letter or @"
        return 1
    fi

    # Check for reserved names
    local reserved=("node_modules" "favicon.ico" "package" "npm" "pnpm")
    for r in "${reserved[@]}"; do
        if [[ "$name" == "$r" ]]; then
            print_error "\"$name\" is a reserved name"
            return 1
        fi
    done

    return 0
}

check_already_initialized() {
    # Check if app-shell references still exist
    if ! grep -q '"name": "app-shell"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
        return 0  # Already initialized
    fi
    return 1  # Not yet initialized
}

#######################################
# Platform-compatible sed in-place
#######################################
sed_inplace() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$@"
    else
        sed -i "$@"
    fi
}

#######################################
# File transformation functions
#######################################
MODIFIED_FILES=()

replace_in_file() {
    local file="$1"
    local old_text="$2"
    local new_text="$3"

    if [[ -f "$file" ]] && grep -q "$old_text" "$file" 2>/dev/null; then
        sed_inplace "s|$old_text|$new_text|g" "$file"
        if [[ ! " ${MODIFIED_FILES[*]:-} " =~ " ${file} " ]]; then
            MODIFIED_FILES+=("$file")
        fi
    fi
}

# Global replace using sed (for cases where replace_in_file pattern matching is tricky)
sed_replace() {
    local file="$1"
    local old_text="$2"
    local new_text="$3"

    if [[ -f "$file" ]] && grep -q "$old_text" "$file" 2>/dev/null; then
        sed_inplace "s|$old_text|$new_text|g" "$file"
        if [[ ! " ${MODIFIED_FILES[*]:-} " =~ " ${file} " ]]; then
            MODIFIED_FILES+=("$file")
        fi
    fi
}

transform_package_json_files() {
    local new_name="$1"
    local scoped_name="@${new_name}"

    print_info "Updating package.json files..."

    # Root package.json
    replace_in_file "$PROJECT_ROOT/package.json" '"name": "app-shell"' "\"name\": \"$new_name\""
    replace_in_file "$PROJECT_ROOT/package.json" 'App Shell - A monorepo' "$new_name - A monorepo"

    # apps/api/package.json
    replace_in_file "$PROJECT_ROOT/apps/api/package.json" '"name": "@app-shell/api"' "\"name\": \"${scoped_name}/api\""
    replace_in_file "$PROJECT_ROOT/apps/api/package.json" '"@app-shell/shared": "workspace:\*"' "\"${scoped_name}/shared\": \"workspace:*\""

    # apps/web/package.json
    replace_in_file "$PROJECT_ROOT/apps/web/package.json" '"name": "@app-shell/web"' "\"name\": \"${scoped_name}/web\""
    replace_in_file "$PROJECT_ROOT/apps/web/package.json" '"@app-shell/shared": "workspace:\*"' "\"${scoped_name}/shared\": \"workspace:*\""

    # packages/shared/package.json
    replace_in_file "$PROJECT_ROOT/packages/shared/package.json" '"name": "@app-shell/shared"' "\"name\": \"${scoped_name}/shared\""
}

transform_docker_files() {
    local new_name="$1"

    print_info "Updating Docker configurations..."

    # docker-compose.yml - container names
    replace_in_file "$PROJECT_ROOT/docker-compose.yml" "container_name: app-shell-db" "container_name: ${new_name}-db"
    replace_in_file "$PROJECT_ROOT/docker-compose.yml" "container_name: app-shell-api" "container_name: ${new_name}-api"
    replace_in_file "$PROJECT_ROOT/docker-compose.yml" "container_name: app-shell-web" "container_name: ${new_name}-web"

    # docker-compose.yml - network references (use sed for global replace)
    sed_replace "$PROJECT_ROOT/docker-compose.yml" "app-shell" "${new_name}"

    # docker-compose.prod.yml if it exists
    if [[ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        sed_replace "$PROJECT_ROOT/docker-compose.prod.yml" "app-shell" "${new_name}"
    fi

    # Dockerfile.api - pnpm filter command
    replace_in_file "$PROJECT_ROOT/docker/Dockerfile.api" "@app-shell/shared" "@${new_name}/shared"
}

transform_source_files() {
    local new_name="$1"
    local scoped_name="@${new_name}"

    print_info "Updating source code imports..."

    # Find all TypeScript/JavaScript files and replace imports
    while IFS= read -r -d '' file; do
        replace_in_file "$file" "@app-shell/shared" "${scoped_name}/shared"
        replace_in_file "$file" "@app-shell/api" "${scoped_name}/api"
        replace_in_file "$file" "@app-shell/web" "${scoped_name}/web"
    done < <(find "$PROJECT_ROOT/apps" "$PROJECT_ROOT/packages" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0 2>/dev/null)

    # next.config.js - transpilePackages
    replace_in_file "$PROJECT_ROOT/apps/web/next.config.js" "@app-shell/shared" "${scoped_name}/shared"
}

transform_dev_script() {
    local new_name="$1"
    local display_name="${new_name//-/ }"  # Replace hyphens with spaces for display
    # Capitalize first letter of each word
    display_name=$(echo "$display_name" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

    print_info "Updating dev.sh script..."

    # Update header display name
    replace_in_file "$PROJECT_ROOT/dev.sh" "App Shell - Full-Stack Application Template" "$display_name - Full-Stack Application"
    replace_in_file "$PROJECT_ROOT/dev.sh" "# App Shell Development Script" "# $display_name Development Script"

    # Update pnpm filter commands
    replace_in_file "$PROJECT_ROOT/dev.sh" "@app-shell/api" "@${new_name}/api"
    replace_in_file "$PROJECT_ROOT/dev.sh" "@app-shell/web" "@${new_name}/web"
    replace_in_file "$PROJECT_ROOT/dev.sh" "@app-shell/shared" "@${new_name}/shared"

    # Update container name references in dev.sh
    replace_in_file "$PROJECT_ROOT/dev.sh" "app-shell-api" "${new_name}-api"
    replace_in_file "$PROJECT_ROOT/dev.sh" "app-shell-web" "${new_name}-web"
    replace_in_file "$PROJECT_ROOT/dev.sh" "app-shell-db" "${new_name}-db"
    replace_in_file "$PROJECT_ROOT/dev.sh" "grep app-shell" "grep ${new_name}"

    # Update staging.sh if it exists
    if [[ -f "$PROJECT_ROOT/scripts/staging.sh" ]]; then
        sed_replace "$PROJECT_ROOT/scripts/staging.sh" "app-shell" "${new_name}"
    fi
}

transform_ci_workflow() {
    local new_name="$1"
    local db_prefix="${new_name//-/_}"  # Replace hyphens with underscores for DB names

    print_info "Updating CI/CD workflow..."

    # Update GitHub Actions workflow
    replace_in_file "$PROJECT_ROOT/.github/workflows/ci.yml" "app_shell_user" "${db_prefix}_user"
    replace_in_file "$PROJECT_ROOT/.github/workflows/ci.yml" "app_shell_pass" "${db_prefix}_pass"
    replace_in_file "$PROJECT_ROOT/.github/workflows/ci.yml" "app_shell_db" "${db_prefix}_db"
    replace_in_file "$PROJECT_ROOT/.github/workflows/ci.yml" "@app-shell/shared" "@${new_name}/shared"
}

transform_lint_config() {
    local new_name="$1"

    print_info "Updating lint configuration..."

    replace_in_file "$PROJECT_ROOT/.lintstagedrc.js" "@app-shell/web" "@${new_name}/web"
    replace_in_file "$PROJECT_ROOT/.lintstagedrc.js" "@app-shell/api" "@${new_name}/api"
    replace_in_file "$PROJECT_ROOT/.lintstagedrc.js" "@app-shell/shared" "@${new_name}/shared"
}

transform_readme() {
    local new_name="$1"
    local display_name="${new_name//-/ }"
    display_name=$(echo "$display_name" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

    print_info "Updating README.md..."

    # Update title and references
    replace_in_file "$PROJECT_ROOT/README.md" "# App Shell" "# $display_name"
    replace_in_file "$PROJECT_ROOT/README.md" "App Shell provides" "$display_name provides"
    replace_in_file "$PROJECT_ROOT/README.md" "App Shell -" "$display_name -"
    replace_in_file "$PROJECT_ROOT/README.md" "app-shell/" "${new_name}/"
}

transform_misc_files() {
    local new_name="$1"
    local display_name="${new_name//-/ }"
    display_name=$(echo "$display_name" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

    print_info "Updating miscellaneous files..."

    # Update setup script
    replace_in_file "$PROJECT_ROOT/scripts/setup_project.sh" "App Shell - Project Setup" "${new_name} - Project Setup"

    # Update worker entrypoint
    replace_in_file "$PROJECT_ROOT/docker/entrypoint-worker-dev.sh" "App Shell Worker" "${new_name} Worker"

    # Update email sender in API (use new_name as domain hint)
    replace_in_file "$PROJECT_ROOT/apps/api/src/utils/email.ts" "noreply@app-shell.local" "noreply@${new_name}.local"

    # Update theme guide
    replace_in_file "$PROJECT_ROOT/apps/web/src/styles/themes/THEME-CREATION-GUIDE.md" "App Shell theming" "${new_name} theming"

    # Update Next.js layout metadata (title and description)
    replace_in_file "$PROJECT_ROOT/apps/web/src/app/layout.tsx" "title: 'App Shell'" "title: '$display_name'"
    replace_in_file "$PROJECT_ROOT/apps/web/src/app/layout.tsx" "description: 'A full-stack application starter template'" "description: '$display_name - A full-stack application'"

    # Update login page test to use new project name
    replace_in_file "$PROJECT_ROOT/apps/web/src/app/__tests__/login-page.test.tsx" "screen.getByText('App Shell')" "screen.getByText('$display_name')"

    # Update login page branding (if using default login page)
    replace_in_file "$PROJECT_ROOT/apps/web/src/app/login/page.tsx" ">App Shell<" ">$display_name<"
    replace_in_file "$PROJECT_ROOT/apps/web/src/app/login/page.tsx" "App Shell</h1>" "$display_name</h1>"
}

create_fresh_changelog() {
    local new_name="$1"
    local display_name="${new_name//-/ }"
    display_name=$(echo "$display_name" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')
    local today=$(date +%Y-%m-%d)

    print_info "Creating fresh CHANGELOG.md..."

    cat > "$PROJECT_ROOT/CHANGELOG.md" << EOF
# Changelog

All notable changes to $display_name will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - $today

### Added
- Initial project setup from App Shell template
- Authentication system with session management
- PostgreSQL database integration with TypeORM
- Next.js frontend with shadcn/ui components
- Express API backend
- Docker Compose development environment
- Monorepo structure with pnpm workspaces and Turborepo
EOF

    MODIFIED_FILES+=("$PROJECT_ROOT/CHANGELOG.md")
}

#######################################
# Regenerate lockfile
#######################################
regenerate_lockfile() {
    print_info "Regenerating pnpm-lock.yaml with updated package names..."

    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm not found — skipping lockfile regeneration."
        print_warning "Run 'pnpm install' manually before building Docker images."
        return 0
    fi

    if ! pnpm --dir "$PROJECT_ROOT" install --no-frozen-lockfile --silent; then
        print_warning "pnpm install failed — lockfile may be stale."
        print_warning "Run 'pnpm install' manually before building Docker images."
    else
        print_success "pnpm-lock.yaml regenerated"
    fi
}

#######################################
# Git operations
#######################################
reset_git_history() {
    local new_name="$1"
    local display_name="${new_name//-/ }"
    display_name=$(echo "$display_name" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

    print_info "Initializing fresh Git repository..."

    # Remove existing git directory
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        rm -rf "$PROJECT_ROOT/.git"
        print_success "Removed existing Git history"
    fi

    # Initialize new repository
    cd "$PROJECT_ROOT"
    git init --quiet
    git add -A
    git commit --quiet -m "Initial commit: $display_name

Created from App Shell template (https://github.com/jmcdice/app-shell)

Features included:
- Next.js 15 frontend with shadcn/ui
- Express API with TypeORM
- PostgreSQL database
- Session-based authentication
- Docker Compose development environment
- pnpm workspaces + Turborepo"

    print_success "Created initial commit"
}

#######################################
# Cleanup operations
#######################################
cleanup_template_files() {
    print_info "Cleaning up template-specific files..."

    # Remove this initialization script (optional - we'll ask)
    # The script will be removed at the end if user confirms

    # Remove any leftover template files
    local files_to_remove=(
        "$PROJECT_ROOT/notes.md"
    )

    for file in "${files_to_remove[@]}"; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            print_success "Removed: $(basename "$file")"
        fi
    done
}

#######################################
# Display functions
#######################################
show_preview() {
    local new_name="$1"
    local scoped_name="@${new_name}"
    local display_name="${new_name//-/ }"
    display_name=$(echo "$display_name" | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

    echo ""
    echo -e "${BOLD}Preview of changes:${NC}"
    echo ""
    echo -e "  Project name:     ${CYAN}$new_name${NC}"
    echo -e "  Display name:     ${CYAN}$display_name${NC}"
    echo -e "  Package scope:    ${CYAN}$scoped_name${NC}"
    echo ""
    echo -e "${BOLD}Packages will be renamed:${NC}"
    echo -e "  app-shell         → $new_name"
    echo -e "  @app-shell/api    → ${scoped_name}/api"
    echo -e "  @app-shell/web    → ${scoped_name}/web"
    echo -e "  @app-shell/shared → ${scoped_name}/shared"
    echo ""
    echo -e "${BOLD}Files to be modified:${NC}"
    echo "  • package.json (root + 3 workspaces)"
    echo "  • README.md"
    echo "  • docker-compose.yml"
    echo "  • dev.sh"
    echo "  • .github/workflows/ci.yml"
    echo "  • .lintstagedrc.js"
    echo "  • Docker configurations"
    echo "  • Source code imports (~12 files)"
    echo ""
    echo -e "${BOLD}Additional actions:${NC}"
    echo "  • Create fresh CHANGELOG.md"
    echo "  • Remove .git and create fresh repository"
    echo "  • Create initial commit"
    echo ""
}

show_summary() {
    local new_name="$1"
    local file_count="${#MODIFIED_FILES[@]}"

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Project initialization complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BOLD}Modified ${file_count} files:${NC}"
    for file in "${MODIFIED_FILES[@]}"; do
        echo "  • ${file#$PROJECT_ROOT/}"
    done
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo ""
    echo "  1. Start development environment:"
    echo -e "     ${CYAN}./dev.sh up${NC}"
    echo ""
    echo "  2. Access your application:"
    echo "     • Web:  http://localhost:3001"
    echo "     • API:  http://localhost:4001"
    echo ""
    echo "  3. Set up your remote repository:"
    echo -e "     ${CYAN}git remote add origin <your-repo-url>${NC}"
    echo -e "     ${CYAN}git push -u origin main${NC}"
    echo ""
}



#######################################
# Help
#######################################
show_help() {
    echo "Usage: $0 [OPTIONS] <project-name> <target-directory>"
    echo ""
    echo "Create a new project from the App Shell template."
    echo ""
    echo "This copies the template to a new directory and customizes it."
    echo "The original App Shell template remains untouched."
    echo ""
    echo "Arguments:"
    echo "  project-name       Name for your new project (e.g., my-awesome-app)"
    echo "  target-directory   Where to create the project (must not exist)"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -d, --dry-run   Preview changes without creating files"
    echo "  -y, --yes       Skip confirmation prompts"
    echo ""
    echo "Examples:"
    echo "  $0 my-awesome-app ../my-awesome-app"
    echo "  $0 my-app ~/projects/my-app"
    echo "  $0 --dry-run my-app /tmp/my-app"
    echo ""
}

#######################################
# Copy template to new directory
#######################################
copy_template() {
    local target_dir="$1"

    print_info "Copying template to $target_dir..."

    # Create target directory
    mkdir -p "$target_dir"

    # Copy all files except .git, node_modules, and build artifacts
    rsync -a \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='.turbo' \
        --exclude='coverage' \
        --exclude='*.log' \
        --exclude='notes.md' \
        "$TEMPLATE_ROOT/" "$target_dir/"

    print_success "Template copied to $target_dir"
}

#######################################
# Main function
#######################################
TOTAL_STEPS=10
DRY_RUN=false
SKIP_CONFIRM=false

main() {
    # Parse options
    local new_name=""
    local target_dir=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -y|--yes)
                SKIP_CONFIRM=true
                shift
                ;;
            -*)
                print_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
            *)
                # First positional arg is project name, second is target dir
                if [[ -z "$new_name" ]]; then
                    new_name="$1"
                elif [[ -z "$target_dir" ]]; then
                    target_dir="$1"
                else
                    print_error "Too many arguments: $1"
                    echo "Use --help for usage information."
                    exit 1
                fi
                shift
                ;;
        esac
    done

    print_header

    # Require both project name and target directory
    if [[ -z "$new_name" ]] || [[ -z "$target_dir" ]]; then
        print_error "Both project name and target directory are required."
        echo ""
        echo "Usage: $0 <project-name> <target-directory>"
        echo ""
        echo "Examples:"
        echo "  $0 my-awesome-app ../my-awesome-app"
        echo "  $0 my-app ~/projects/my-app"
        echo ""
        echo "Use --help for more information."
        exit 1
    fi

    # Validate project name
    if ! validate_project_name "$new_name"; then
        exit 1
    fi

    # Expand to absolute path
    # First create parent dir path if needed for resolution
    mkdir -p "$(dirname "$target_dir")" 2>/dev/null || true
    target_dir="$(cd "$(dirname "$target_dir")" 2>/dev/null && pwd)/$(basename "$target_dir")" || target_dir="$target_dir"

    # Check if target directory already exists
    if [[ -d "$target_dir" ]]; then
        print_error "Target directory already exists: $target_dir"
        echo "Please remove it first or choose a different location."
        exit 1
    fi

    # Set PROJECT_ROOT to the new target directory
    PROJECT_ROOT="$target_dir"

    # Show preview and confirm
    show_preview "$new_name"

    echo -e "  ${BOLD}Target directory:${NC} ${CYAN}$target_dir${NC}"
    echo ""

    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
        echo ""
        print_success "Dry run complete. Run without --dry-run to apply changes."
        exit 0
    fi

    if [[ "$SKIP_CONFIRM" != true ]]; then
        echo -e "${YELLOW}This will create a new project directory and initialize it.${NC}"
        read -p "Proceed? (y/N) " confirm
        echo ""

        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            print_warning "Initialization cancelled"
            exit 0
        fi
    fi

    # Execute transformations
    echo -e "${BOLD}Creating new project...${NC}"
    echo ""

    print_step 1 "Copying template to new directory"
    copy_template "$target_dir"

    print_step 2 "Updating package.json files"
    transform_package_json_files "$new_name"

    print_step 3 "Updating Docker configurations"
    transform_docker_files "$new_name"

    print_step 4 "Updating source code imports"
    transform_source_files "$new_name"

    print_step 5 "Updating dev.sh script"
    transform_dev_script "$new_name"

    print_step 6 "Updating CI/CD workflow"
    transform_ci_workflow "$new_name"

    print_step 7 "Updating lint and misc configurations"
    transform_lint_config "$new_name"
    transform_readme "$new_name"
    transform_misc_files "$new_name"

    print_step 8 "Creating fresh CHANGELOG.md"
    create_fresh_changelog "$new_name"
    cleanup_template_files

    print_step 9 "Regenerating pnpm lockfile"
    regenerate_lockfile

    print_step 10 "Initializing Git repository"
    reset_git_history "$new_name"

    # Show summary
    show_summary "$new_name"

    # Remove the initialization script from the new project (it's not needed there)
    rm -f "$PROJECT_ROOT/scripts/create_new_project.sh"
    print_success "Removed initialization script from new project"

    echo ""
    echo -e "${BOLD}Your new project is ready at:${NC}"
    echo -e "  ${CYAN}$target_dir${NC}"
    echo ""
    print_success "Happy coding! 🚀"
    echo ""
}

# Run main with all arguments
main "$@"
