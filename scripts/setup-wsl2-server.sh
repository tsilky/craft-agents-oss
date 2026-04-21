#!/usr/bin/env bash
# =============================================================================
# Craft Agents Server — WSL2 Setup Script
#
# Run this inside a fresh WSL2 Ubuntu instance.
# It will:
#   1. Install system dependencies (git, ripgrep, docker CLI, etc.)
#   2. Install Bun
#   3. Clone and build the Craft Agents server
#   4. Set up git pre-push hooks (block force push & push to main/master)
#   5. Create a systemd service that auto-starts on boot
#   6. Generate a secure server token
#
# Usage:
#   curl -fsSL <url> | bash
#   # or
#   bash setup-wsl2-server.sh
#
# Prerequisites:
#   - WSL2 with Ubuntu (22.04+ recommended)
#   - systemd enabled in WSL2 (see below)
#   - Docker Desktop on Windows with WSL2 integration enabled
#   - Tailscale installed on Windows host
# =============================================================================

set -euo pipefail

# --- Configuration -----------------------------------------------------------
# Override these with environment variables before running the script

CRAFT_REPO="${CRAFT_REPO:-https://github.com/tsilky/craft-agents-oss.git}"
CRAFT_BRANCH="${CRAFT_BRANCH:-main}"
WORKSPACE_DIR="${WORKSPACE_DIR:-/workspace}"
INSTALL_DIR="${WORKSPACE_DIR}/craft-agents"
PROJECTS_DIR="${WORKSPACE_DIR}/projects"
WORKTREES_DIR="${WORKSPACE_DIR}/worktrees"
CRAFT_RPC_PORT="${CRAFT_RPC_PORT:-9100}"
CRAFT_USER="${CRAFT_USER:-craftagent}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Pre-flight checks -------------------------------------------------------

if [[ "$(uname -r)" != *microsoft* && "$(uname -r)" != *WSL* ]]; then
  warn "This doesn't appear to be WSL2. Continuing anyway..."
fi

if [[ $EUID -eq 0 ]]; then
  error "Don't run this script as root. It will use sudo where needed."
  exit 1
fi

# Check systemd
if ! pidof systemd > /dev/null 2>&1; then
  warn "systemd is not running. Enabling it..."
  if [[ ! -f /etc/wsl.conf ]] || ! grep -q '\[boot\]' /etc/wsl.conf 2>/dev/null; then
    echo -e "\n[boot]\nsystemd=true" | sudo tee -a /etc/wsl.conf > /dev/null
    warn "systemd enabled in /etc/wsl.conf. You need to restart WSL2:"
    warn "  In PowerShell: wsl --shutdown"
    warn "  Then reopen your WSL2 terminal and re-run this script."
    exit 1
  fi
fi

# --- Step 1: System dependencies ---------------------------------------------

info "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  git \
  ripgrep \
  ca-certificates \
  curl \
  unzip \
  build-essential \
  python3 \
  jq

# Docker CLI (talks to Docker Desktop on Windows via socket)
if ! command -v docker &> /dev/null; then
  info "Docker CLI not found. It should be available via Docker Desktop WSL2 integration."
  info "Make sure Docker Desktop → Settings → Resources → WSL Integration is enabled for this distro."
fi

# --- Step 2: Install Bun -----------------------------------------------------

if ! command -v bun &> /dev/null; then
  info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  info "Bun installed: $(bun --version)"
else
  info "Bun already installed: $(bun --version)"
fi

# Ensure bun is on PATH for the service later
if ! grep -q 'BUN_INSTALL' ~/.bashrc 2>/dev/null; then
  echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
  echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi

# --- Step 3: Create workspace directories ------------------------------------

info "Creating workspace directories..."
sudo mkdir -p "$WORKSPACE_DIR" "$PROJECTS_DIR" "$WORKTREES_DIR"
sudo chown -R "$(id -u):$(id -g)" "$WORKSPACE_DIR"

# --- Step 4: Clone and build -------------------------------------------------

if [[ -d "$INSTALL_DIR/.git" ]]; then
  info "Craft Agents repo already exists at $INSTALL_DIR, pulling latest..."
  cd "$INSTALL_DIR"
  git pull origin "$CRAFT_BRANCH"
else
  info "Cloning Craft Agents..."
  git clone --branch "$CRAFT_BRANCH" "$CRAFT_REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

info "Installing dependencies..."
bun install

info "Building MCP helper servers..."
bun build packages/session-mcp-server/src/index.ts \
  --outfile packages/session-mcp-server/dist/index.js --target node --format cjs
bun build packages/pi-agent-server/src/index.ts \
  --outfile packages/pi-agent-server/dist/index.js --target node --format cjs

info "Building WebUI..."
bunx vite build --config apps/webui/vite.config.ts

# --- Step 5: Git hook template ------------------------------------------------

info "Setting up git hook templates..."

GIT_TEMPLATE_DIR="$HOME/.git-templates/hooks"
mkdir -p "$GIT_TEMPLATE_DIR"

cat > "$GIT_TEMPLATE_DIR/pre-push" << 'HOOKEOF'
#!/usr/bin/env bash
# =============================================================================
# pre-push hook — blocks force pushes and direct pushes to main/master
# =============================================================================

# Check if this is a force push (--force or --force-with-lease in parent process)
PARENT_CMD=$(ps -o args= $PPID 2>/dev/null || true)
if [[ "$PARENT_CMD" == *"--force"* ]] || [[ "$PARENT_CMD" == *"-f "* ]]; then
  echo "=========================================="
  echo "  BLOCKED: Force push is not allowed."
  echo "=========================================="
  exit 1
fi

# Check each ref being pushed
while read -r local_ref local_sha remote_ref remote_sha; do
  # Block pushes to main or master
  if [[ "$remote_ref" == "refs/heads/main" ]] || [[ "$remote_ref" == "refs/heads/master" ]]; then
    echo "=========================================="
    echo "  BLOCKED: Direct push to ${remote_ref#refs/heads/} is not allowed."
    echo "  Use a feature branch and create a PR."
    echo "=========================================="
    exit 1
  fi

  # Block branch deletion (remote_ref push with null sha)
  if [[ "$local_sha" == "0000000000000000000000000000000000000000" ]]; then
    echo "=========================================="
    echo "  BLOCKED: Remote branch deletion is not allowed."
    echo "  Branch: ${remote_ref#refs/heads/}"
    echo "=========================================="
    exit 1
  fi
done

exit 0
HOOKEOF
chmod +x "$GIT_TEMPLATE_DIR/pre-push"

# Apply template globally
git config --global init.templateDir "$HOME/.git-templates"

# Install hook into existing repos
info "Installing pre-push hook into existing repos..."
for repo_dir in "$INSTALL_DIR" "$PROJECTS_DIR"/*/; do
  if [[ -d "${repo_dir}.git" ]]; then
    cp "$GIT_TEMPLATE_DIR/pre-push" "${repo_dir}.git/hooks/pre-push"
    chmod +x "${repo_dir}.git/hooks/pre-push"
    info "  Installed hook in: $repo_dir"
  fi
done

# Make hook template immutable (optional, uncomment to enable)
# sudo chattr +i "$GIT_TEMPLATE_DIR/pre-push"

# --- Step 6: Generate server token -------------------------------------------

TOKEN_FILE="$HOME/.craft-agent-server-token"
if [[ -f "$TOKEN_FILE" ]]; then
  info "Server token already exists at $TOKEN_FILE"
  CRAFT_SERVER_TOKEN=$(cat "$TOKEN_FILE")
else
  info "Generating server token..."
  CRAFT_SERVER_TOKEN=$(openssl rand -hex 32)
  echo "$CRAFT_SERVER_TOKEN" > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
  info "Token saved to $TOKEN_FILE (mode 600)"
fi

# --- Step 7: Generate webui password -----------------------------------------

WEBUI_PASS_FILE="$HOME/.craft-agent-webui-password"
if [[ -f "$WEBUI_PASS_FILE" ]]; then
  info "WebUI password already exists at $WEBUI_PASS_FILE"
  CRAFT_WEBUI_PASSWORD=$(cat "$WEBUI_PASS_FILE")
else
  info "Generating WebUI password..."
  CRAFT_WEBUI_PASSWORD=$(openssl rand -base64 16)
  echo "$CRAFT_WEBUI_PASSWORD" > "$WEBUI_PASS_FILE"
  chmod 600 "$WEBUI_PASS_FILE"
  info "WebUI password saved to $WEBUI_PASS_FILE (mode 600)"
fi

# --- Step 8: Create environment file -----------------------------------------

ENV_FILE="$HOME/.craft-agent-server.env"
cat > "$ENV_FILE" << ENVEOF
# Craft Agent Server environment
CRAFT_SERVER_TOKEN=${CRAFT_SERVER_TOKEN}
CRAFT_RPC_HOST=0.0.0.0
CRAFT_RPC_PORT=${CRAFT_RPC_PORT}
CRAFT_WEBUI_DIR=${INSTALL_DIR}/apps/webui/dist
CRAFT_WEBUI_PASSWORD=${CRAFT_WEBUI_PASSWORD}
CRAFT_BUNDLED_ASSETS_ROOT=${INSTALL_DIR}/apps/electron

# Bun path
BUN_INSTALL=${HOME}/.bun
PATH=${HOME}/.bun/bin:/usr/local/bin:/usr/bin:/bin

# Docker socket (Docker Desktop WSL2 integration)
DOCKER_HOST=unix:///var/run/docker.sock

# Uncomment for debug logging
# CRAFT_DEBUG=true
ENVEOF
chmod 600 "$ENV_FILE"
info "Environment file created at $ENV_FILE"

# --- Step 9: Create systemd service ------------------------------------------

info "Creating systemd service..."

SERVICE_FILE="/tmp/craft-agent-server.service"
cat > "$SERVICE_FILE" << SERVICEEOF
[Unit]
Description=Craft Agent Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$(whoami)
Group=$(id -gn)
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=${HOME}/.bun/bin/bun run packages/server/src/index.ts --allow-insecure-bind
Restart=always
RestartSec=5

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=craft-agent

# Security hardening
NoNewPrivileges=true
ProtectHome=read-only
ReadWritePaths=${HOME}/.craft-agent ${WORKSPACE_DIR}

# Resource limits (adjust as needed)
# LimitNOFILE=65536
# MemoryMax=8G

[Install]
WantedBy=multi-user.target
SERVICEEOF

sudo mv "$SERVICE_FILE" /etc/systemd/system/craft-agent-server.service
sudo systemctl daemon-reload
sudo systemctl enable craft-agent-server.service

info "Systemd service created and enabled."

# --- Step 10: Helper scripts -------------------------------------------------

info "Creating helper scripts..."

# Update script
cat > "$WORKSPACE_DIR/update-craft-agents.sh" << 'UPDATEEOF'
#!/usr/bin/env bash
set -euo pipefail
cd /workspace/craft-agents
echo "Pulling latest changes..."
git pull origin main
echo "Installing dependencies..."
bun install
echo "Rebuilding MCP helpers..."
bun build packages/session-mcp-server/src/index.ts \
  --outfile packages/session-mcp-server/dist/index.js --target node --format cjs
bun build packages/pi-agent-server/src/index.ts \
  --outfile packages/pi-agent-server/dist/index.js --target node --format cjs
echo "Rebuilding WebUI..."
bunx vite build --config apps/webui/vite.config.ts
echo "Restarting service..."
sudo systemctl restart craft-agent-server
echo "Done! Status:"
sudo systemctl status craft-agent-server --no-pager
UPDATEEOF
chmod +x "$WORKSPACE_DIR/update-craft-agents.sh"

# Clone project helper (sets up hooks automatically)
cat > "$WORKSPACE_DIR/clone-project.sh" << 'CLONEEOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ $# -lt 1 ]]; then
  echo "Usage: clone-project.sh <git-url> [directory-name]"
  exit 1
fi
REPO_URL="$1"
DIR_NAME="${2:-$(basename "$1" .git)}"
TARGET="/workspace/projects/$DIR_NAME"
echo "Cloning $REPO_URL into $TARGET..."
git clone "$REPO_URL" "$TARGET"
# Hook is auto-installed via init.templateDir
echo "Done! Pre-push hooks are active."
echo "  Project: $TARGET"
CLONEEOF
chmod +x "$WORKSPACE_DIR/clone-project.sh"

# --- Done! -------------------------------------------------------------------

echo ""
echo "=============================================="
echo "  Craft Agent Server Setup Complete!"
echo "=============================================="
echo ""
echo "  Server token:    $TOKEN_FILE"
echo "  WebUI password:  $WEBUI_PASS_FILE"
echo "  Environment:     $ENV_FILE"
echo "  Install dir:     $INSTALL_DIR"
echo "  Projects dir:    $PROJECTS_DIR"
echo "  Worktrees dir:   $WORKTREES_DIR"
echo ""
echo "  Commands:"
echo "    Start now:     sudo systemctl start craft-agent-server"
echo "    Check status:  sudo systemctl status craft-agent-server"
echo "    View logs:     journalctl -u craft-agent-server -f"
echo "    Update:        $WORKSPACE_DIR/update-craft-agents.sh"
echo "    Clone project: $WORKSPACE_DIR/clone-project.sh <git-url>"
echo ""
echo "  Connect from your Mac (via Tailscale):"
echo "    Browser:  http://<windows-tailscale-ip>:${CRAFT_RPC_PORT}"
echo "    Password: $(cat "$WEBUI_PASS_FILE")"
echo ""
echo "  Git protection:"
echo "    - Force push:        BLOCKED"
echo "    - Push to main:      BLOCKED"
echo "    - Branch deletion:   BLOCKED"
echo "    - New repos auto-get hooks via git init template"
echo ""
