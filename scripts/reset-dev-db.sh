#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:=postgres://formalist:formalist@localhost:5432/formalist}"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS drizzle CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SQL

export DATABASE_URL
bun run db:migrate

echo "Development database reset complete. No seed tariff data was inserted."
