set dotenv-load
set export
set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

local_upload_root := ".data/uploads"
local_upload_root_abs := invocation_directory() / local_upload_root
local_database_url := "postgres://formalist:formalist@localhost:5432/formalist"
local_redis_url := "redis://localhost:6379"

export DEPLOYMENT_MODE := "docker-local"
export DATABASE_PROVIDER := "postgres"
export QUEUE_PROVIDER := "local-redis"
export STORE_ORIGINAL_FILES := "true"
export STORE_PAGE_IMAGES := "true"
export STORE_DEBUG_ARTIFACTS := "true"

default:
    @just --groups
    @just --list

[group("infra")]
infra-up:
    docker compose up -d postgres redis

[group("infra")]
infra-down:
    docker compose stop postgres redis

[group("infra")]
infra-logs:
    docker compose logs -f postgres redis

[group("infra")]
infra-status:
    docker compose ps postgres redis

[group("local")]
[unix]
local-artifacts:
    mkdir -p {{ local_upload_root }}

[group("local")]
[windows]
local-artifacts:
    New-Item -ItemType Directory -Force -Path {{ quote(local_upload_root) }} | Out-Null

[group("local")]
[unix]
local-dev: local-artifacts
    DATABASE_URL={{ local_database_url }} REDIS_URL={{ local_redis_url }} UPLOAD_ROOT={{ quote(local_upload_root_abs) }} bun run dev

[group("local")]
[windows]
local-dev: local-artifacts
    $env:DATABASE_URL = "{{ local_database_url }}"; $env:REDIS_URL = "{{ local_redis_url }}"; $env:UPLOAD_ROOT = {{ quote(local_upload_root_abs) }}; bun run dev

[group("local")]
[unix]
local-worker: local-artifacts
    DATABASE_URL={{ local_database_url }} REDIS_URL={{ local_redis_url }} UPLOAD_ROOT={{ quote(local_upload_root_abs) }} bun run worker

[group("local")]
[windows]
local-worker: local-artifacts
    $env:DATABASE_URL = "{{ local_database_url }}"; $env:REDIS_URL = "{{ local_redis_url }}"; $env:UPLOAD_ROOT = {{ quote(local_upload_root_abs) }}; bun run worker

[group("local")]
[unix]
local-all: infra-up local-artifacts
    set -euo pipefail; \
    trap 'kill 0' INT TERM EXIT; \
    DATABASE_URL={{ local_database_url }} REDIS_URL={{ local_redis_url }} UPLOAD_ROOT={{ quote(local_upload_root_abs) }} bun run worker & \
    DATABASE_URL={{ local_database_url }} REDIS_URL={{ local_redis_url }} UPLOAD_ROOT={{ quote(local_upload_root_abs) }} bun run dev

[group("local")]
[windows]
local-all: infra-up local-artifacts
    $env:DATABASE_URL = "{{ local_database_url }}"; $env:REDIS_URL = "{{ local_redis_url }}"; $env:UPLOAD_ROOT = {{ quote(local_upload_root_abs) }}; $worker = Start-Process -FilePath "bun" -ArgumentList @("run", "worker") -NoNewWindow -PassThru; try { bun run dev } finally { Stop-Process -Id $worker.Id -ErrorAction SilentlyContinue }

[group("db")]
[unix]
db-migrate: infra-up local-artifacts
    DATABASE_URL={{ local_database_url }} REDIS_URL={{ local_redis_url }} UPLOAD_ROOT={{ quote(local_upload_root_abs) }} bun run db:migrate

[group("db")]
[windows]
db-migrate: infra-up local-artifacts
    $env:DATABASE_URL = "{{ local_database_url }}"; $env:REDIS_URL = "{{ local_redis_url }}"; $env:UPLOAD_ROOT = {{ quote(local_upload_root_abs) }}; bun run db:migrate

[group("db")]
db-generate:
    bun run db:generate

[group("db")]
[unix]
db-studio:
    DATABASE_URL={{ local_database_url }} bun run db:studio

[group("db")]
[windows]
db-studio:
    $env:DATABASE_URL = "{{ local_database_url }}"; bun run db:studio

[group("db")]
[unix]
db-reset:
    DATABASE_URL={{ local_database_url }} bash scripts/reset-dev-db.sh

[group("db")]
[windows]
db-reset:
    $env:DATABASE_URL = "{{ local_database_url }}"; psql $env:DATABASE_URL -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS drizzle CASCADE;" -c "DROP SCHEMA public CASCADE;" -c "CREATE SCHEMA public;"; bun run db:migrate; Write-Output "Development database reset complete. No seed tariff data was inserted."

[group("docker")]
docker-dev:
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

[group("docker")]
docker-prod:
    docker compose up --build

[group("docker")]
docker-migrate:
    docker compose --profile tools run --rm migrate

[group("docker")]
docker-down:
    docker compose down

[group("docker")]
docker-down-volumes:
    docker compose down --volumes --remove-orphans

[group("docker")]
docker-logs:
    docker compose logs -f app worker postgres redis

[group("test")]
check:
    bun run lint
    bun run typecheck

[group("test")]
test:
    bun test

[group("test")]
verify:
    bun run verify

[group("test")]
[unix]
e2e:
    RUN_BROWSER_E2E=1 bun run test:e2e

[group("test")]
[windows]
e2e:
    $env:RUN_BROWSER_E2E = "1"; bun run test:e2e

[group("util")]
format:
    bun x ultracite fix

[group("util")]
build-images:
    docker compose build app worker
    docker compose -f docker-compose.yml -f docker-compose.dev.yml build app worker
