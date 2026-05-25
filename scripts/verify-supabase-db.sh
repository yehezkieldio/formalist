#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DATABASE_URL:-${DATABASE_URL:-}}" ]]; then
  echo "SUPABASE_DATABASE_URL or DATABASE_URL is required." >&2
  exit 1
fi

export DATABASE_PROVIDER=supabase
export DATABASE_URL="${SUPABASE_DATABASE_URL:-${DATABASE_URL}}"

bun run db:migrate
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "select extname from pg_extension where extname in ('vector', 'pgcrypto');"
