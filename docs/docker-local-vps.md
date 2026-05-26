# Docker Local/VPS

Docker mode is the primary self-hosted path. It runs the app, worker, local
Postgres with pgvector, local Redis, and a local upload volume.

## Setup

```bash
cp .env.example .env
```

Development mode uses bind mounts, full dependencies, hot reload, and persistent
local artifacts:

```bash
just db-migrate
just local-all
```

Production mode uses multi-stage images, standalone Next output, no source bind
mounts, health checks, and persistent local artifacts:

```bash
just docker-migrate
just docker-prod
```

If you want only Postgres and Redis in Docker while running the app and worker
directly on the host:

```bash
just infra-up
just db-migrate
just local-dev
just local-worker
```

The app listens on `http://localhost:3000` by default.

## Services

- `app`: Next.js 16 App Router application.
- `worker`: ingestion worker for parsing, chunking, extraction, validation, and
  embedding jobs.
- `migrate`: tool profile service for Drizzle migrations.
- `postgres`: local Postgres with pgvector enabled by migrations.
- `redis`: local Redis used by BullMQ when `QUEUE_PROVIDER=local-redis`.

## Uploads

Docker mode always mounts `UPLOAD_ROOT=/data/uploads` and enables local
artifacts inside the containers:

- `STORE_ORIGINAL_FILES=true`
- `STORE_PAGE_IMAGES=true`
- `STORE_DEBUG_ARTIFACTS=true`

Artifacts must not be placed under the public web root.

## Backups

Back up Postgres for documents, pages, chunks, table chunks, facts, tariff rows,
fee rules, chat history, settings, and audit logs. Back up `UPLOAD_ROOT` only
when optional artifacts matter for audit, reprocessing, or source preview.

## Health Checks

Use `/admin/settings` to inspect database, vector, queue, storage, and
OpenRouter status. Missing `OPENROUTER_API_KEY` is degraded, not fatal.
