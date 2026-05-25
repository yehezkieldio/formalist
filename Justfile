set dotenv-load := true
set export := true

local_upload_root := ".data/uploads"
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
local-artifacts:
    mkdir -p {{local_upload_root}}

[group("local")]
local-dev: local-artifacts
    DATABASE_URL={{local_database_url}} REDIS_URL={{local_redis_url}} UPLOAD_ROOT="$PWD/{{local_upload_root}}" bun run dev

[group("local")]
local-worker: local-artifacts
    DATABASE_URL={{local_database_url}} REDIS_URL={{local_redis_url}} UPLOAD_ROOT="$PWD/{{local_upload_root}}" bun run worker

[group("local")]
local-all: infra-up local-artifacts
    set -euo pipefail; \
    trap 'kill 0' INT TERM EXIT; \
    DATABASE_URL={{local_database_url}} REDIS_URL={{local_redis_url}} UPLOAD_ROOT="$PWD/{{local_upload_root}}" bun run worker & \
    DATABASE_URL={{local_database_url}} REDIS_URL={{local_redis_url}} UPLOAD_ROOT="$PWD/{{local_upload_root}}" bun run dev

[group("db")]
db-migrate: infra-up local-artifacts
    DATABASE_URL={{local_database_url}} REDIS_URL={{local_redis_url}} UPLOAD_ROOT="$PWD/{{local_upload_root}}" bun run db:migrate

[group("db")]
db-generate:
    bun run db:generate

[group("db")]
db-studio:
    DATABASE_URL={{local_database_url}} bun run db:studio

[group("db")]
db-reset:
    DATABASE_URL={{local_database_url}} bash scripts/reset-dev-db.sh

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
e2e:
    RUN_BROWSER_E2E=1 bun run test:e2e

[group("util")]
format:
    bun x ultracite fix

[group("util")]
build-images:
    docker compose build app worker
    docker compose -f docker-compose.yml -f docker-compose.dev.yml build app worker
