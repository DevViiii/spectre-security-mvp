#!/usr/bin/env bash
#
# Spectre Security — production deploy.
#
# Pulls the latest dev branch on the production host, rebuilds Docker
# containers, runs migrations, then waits for /health to return 200.
#
# All inputs are environment variables — override on the command line, e.g.:
#   SSH_USER=ubuntu BRANCH=main ./infra/scripts/deploy.sh
#
set -euo pipefail

# ── Inputs ────────────────────────────────────────────────────────────────
SSH_HOST="${SSH_HOST:-3.138.193.24}"
SSH_USER="${SSH_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/Desktop/spectre-security-key.pem}"
REMOTE_DIR="${REMOTE_DIR:-/opt/spectre-security}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://${SSH_HOST}:8000/health}"
HEALTH_TIMEOUT_SECONDS="${HEALTH_TIMEOUT_SECONDS:-90}"

# ── Helpers ───────────────────────────────────────────────────────────────
say()  { printf "\033[36m[deploy]\033[0m %s\n" "$*"; }
warn() { printf "\033[33m[deploy]\033[0m %s\n" "$*" >&2; }
die()  { printf "\033[31m[deploy] %s\033[0m\n" "$*" >&2; exit 1; }

# ── Preflight ─────────────────────────────────────────────────────────────
[[ -f "$SSH_KEY" ]] || die "SSH key not found: $SSH_KEY"
chmod 600 "$SSH_KEY" 2>/dev/null || true

say "host=$SSH_USER@$SSH_HOST  dir=$REMOTE_DIR  branch=$BRANCH"

SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$SSH_USER@$SSH_HOST")

say "verifying SSH..."
"${SSH[@]}" "echo connected" >/dev/null || die "SSH connection failed"

# ── Remote deploy ─────────────────────────────────────────────────────────
say "pulling $BRANCH and rebuilding containers on remote..."
"${SSH[@]}" bash -s -- "$REMOTE_DIR" "$BRANCH" "$COMPOSE_FILE" <<'REMOTE'
set -euo pipefail
REMOTE_DIR="$1"
BRANCH="$2"
COMPOSE_FILE="$3"

cd "$REMOTE_DIR" || { echo "remote dir $REMOTE_DIR not found"; exit 1; }

# Pick the docker compose command available on the host
if command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose -f $COMPOSE_FILE"
else
  DC="docker compose -f $COMPOSE_FILE"
fi

PREV_SHA="$(git rev-parse HEAD)"
echo "[remote] previous: $PREV_SHA"

git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
NEW_SHA="$(git rev-parse HEAD)"
echo "[remote] target:   $NEW_SHA"

if [[ "$PREV_SHA" == "$NEW_SHA" ]]; then
  echo "[remote] no new commits; rebuilding anyway to pick up env/compose changes"
fi

# Build first so a build failure doesn't take services down
$DC build

# Bring services up (rolling: api/worker/frontend recreate; postgres/redis stay)
$DC up -d --remove-orphans

# Wait for the API container to be ready before migrating
for i in $(seq 1 30); do
  if $DC exec -T api python -c "import socket; socket.create_connection(('postgres',5432), timeout=2)" 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "[remote] running migrations..."
$DC exec -T api alembic upgrade head

echo "[remote] deploy commit: $NEW_SHA"
REMOTE

# ── Local-side health check ───────────────────────────────────────────────
say "waiting for ${HEALTH_URL} (timeout ${HEALTH_TIMEOUT_SECONDS}s)..."
deadline=$(( $(date +%s) + HEALTH_TIMEOUT_SECONDS ))
while :; do
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
    say "health OK"
    break
  fi
  if (( $(date +%s) >= deadline )); then
    die "health check failed after ${HEALTH_TIMEOUT_SECONDS}s — inspect with: ${SSH[*]} 'cd $REMOTE_DIR && docker compose logs --tail 200 api'"
  fi
  sleep 3
done

say "deploy complete"
