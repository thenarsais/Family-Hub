#!/bin/bash
#
# Manual backend deploy for the home mini-PC (FR-118 — see docs/DEPLOYMENT.md).
# Run ON the box:  cd ~/family-hub && ./scripts/deploy.sh
#
# Frontend is NOT deployed here — Cloudflare Pages rebuilds it on push to main.
# DB migrations are NOT run here — apply new backend/migrations/*.sql to the
# prod Supabase DB by hand as part of the deploy (the app does not auto-migrate).

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${YELLOW}$*${NC}"; }
ok()    { echo -e "${GREEN}$*${NC}"; }
die()   { echo -e "${RED}$*${NC}" >&2; exit 1; }

cd "$(dirname "$0")/.."

command -v docker >/dev/null || die "docker not installed"
docker info >/dev/null 2>&1 || die "docker daemon not running"
[ -f backend/.env.production ] || die "backend/.env.production missing (copy from .env.production.example)"

info "1/5  Pulling latest main..."
git fetch origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
  info "     Already at origin/main ($LOCAL). Rebuilding anyway."
else
  git merge --ff-only origin/main || die "local main has diverged from origin/main — resolve by hand"
  ok "     $LOCAL -> $REMOTE"
fi

info "2/5  Reminder: apply any new backend/migrations/*.sql to the prod DB now, before restarting."
git diff --name-only "$LOCAL" "$REMOTE" -- backend/migrations/ | sed 's/^/       new: /' || true

info "3/5  Building the API image..."
docker compose -f "$COMPOSE_FILE" build api

info "4/5  Restarting api + redis..."
docker compose -f "$COMPOSE_FILE" up -d

info "5/5  Waiting for the healthcheck..."
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose -f "$COMPOSE_FILE" ps -q api)" 2>/dev/null || echo starting)
  case "$status" in
    healthy)   ok "     API healthy."; break ;;
    unhealthy) docker compose -f "$COMPOSE_FILE" logs --tail=40 api; die "API unhealthy — rolled forward but not serving." ;;
    *)         sleep 2 ;;
  esac
  [ "$i" = 30 ] && { docker compose -f "$COMPOSE_FILE" logs --tail=40 api; die "API did not become healthy in 60s."; }
done

docker image prune -f >/dev/null 2>&1 || true
ok "Done. Test: curl -fsS https://api.example.com/health"
