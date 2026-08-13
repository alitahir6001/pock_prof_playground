#!/usr/bin/env bash
# Read-only local status check for Pocket Professor.
# Usage: bash .claude/skills/pocket-professor-runbook/scripts/status.sh
# Prints env-var NAMES only (never values). Makes no writes.
set -u
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
echo "repo: $ROOT"
echo "commit: $(git -C "$ROOT" log -1 --format='%h %s' 2>/dev/null || echo 'not a git repo')"
echo
echo "== toolchain =="
echo "node: $(node -v 2>/dev/null || echo MISSING)  npm: $(npm -v 2>/dev/null || echo MISSING)"
command -v psql >/dev/null && echo "psql: $(psql --version)" || echo "psql: MISSING (needed for migrations)"
echo
echo "== install/build state =="
[ -d "$ROOT/backend/node_modules" ] && echo "backend deps: installed" || echo "backend deps: MISSING (cd backend && npm install)"
[ -d "$ROOT/backend/dist" ] && echo "backend dist: built" || echo "backend dist: NOT BUILT (npm run build:phase3)"
[ -d "$ROOT/frontend/node_modules" ] && echo "frontend deps: installed" || echo "frontend deps: MISSING (cd frontend && npm install)"
echo
echo "== .env keys present (names only) =="
if [ -f "$ROOT/.env" ]; then
  grep -oE '^[A-Z_0-9]+=' "$ROOT/.env" | tr -d '=' | sort | tr '\n' ' '; echo
else
  echo "NO root .env (backend start:adaptation-runtime needs ../.env)"
fi
[ -f "$ROOT/frontend/.env.local" ] && echo "frontend/.env.local: present" || echo "frontend/.env.local: MISSING (VITE_API_BASE_URL)"
echo
echo "== servers =="
if curl -sf -m 3 http://localhost:3040/adaptation/health >/dev/null 2>&1; then
  echo "backend :3040 health: $(curl -s -m 3 http://localhost:3040/adaptation/health)"
else
  echo "backend :3040: not responding"
fi
curl -sf -m 3 -o /dev/null http://localhost:5173 2>/dev/null && echo "frontend :5173: responding" || echo "frontend :5173: not responding"
echo
echo "== database =="
DB_URL="$(grep -m1 '^DATABASE_URL=' "$ROOT/.env" 2>/dev/null | cut -d= -f2-)"
if [ -n "${DB_URL:-}" ] && command -v psql >/dev/null; then
  TABLES=$(psql "$DB_URL" -tAc "select table_name from information_schema.tables where table_schema='public' order by 1" 2>&1)
  if [ $? -eq 0 ]; then
    echo "tables: $(echo "$TABLES" | tr '\n' ' ')"
    for t in adaptation_evaluations pilot_users pilot_sessions pilot_login_codes pilot_plans pilot_sprint_days; do
      echo "$TABLES" | grep -qx "$t" || echo "  MISSING table: $t (run the matching db:migrate:*:up)"
    done
    psql "$DB_URL" -tAc "select column_name from information_schema.columns where table_name='pilot_login_codes' and column_name='attempts'" 2>/dev/null | grep -q attempts \
      && echo "migration 004 (attempts col): applied" || echo "migration 004 (attempts col): NOT applied"
  else
    echo "postgres: UNREACHABLE ($(echo "$TABLES" | head -1))"
  fi
else
  echo "DATABASE_URL not set in .env or psql missing — skipping DB check"
fi
