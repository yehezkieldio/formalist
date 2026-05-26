#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:=postgres://formalist:formalist@localhost:5432/formalist}"

export DATABASE_URL

bun run db:migrate
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "select extname from pg_extension where extname in ('vector', 'pgcrypto');"
