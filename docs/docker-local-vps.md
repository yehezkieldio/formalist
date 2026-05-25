# Docker Local/VPS

Docker mode is the primary self-hosted path. It runs the app, worker, local
Postgres with pgvector, local Redis, and a local upload volume.

## Setup

```bash
cp .env.example .env
docker compose up -d postgres redis
bun run db:migrate
docker compose up --build app worker
```

The app listens on `http://localhost:3000`.

## Services

- `app`: Next.js 16 App Router application.
- `worker`: ingestion worker for parsing, chunking, extraction, validation, and
  embedding jobs.
- `postgres`: local Postgres with pgvector enabled by migrations.
- `redis`: local Redis used by BullMQ when `QUEUE_PROVIDER=local-redis`.

## Uploads

Set `UPLOAD_ROOT=/data/uploads` for Docker. Optional artifacts are written only
when enabled:

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
