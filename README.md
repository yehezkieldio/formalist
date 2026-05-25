# Formalist

Formalist is a ChatGPT-style agentic RAG assistant for air cargo tariff and
pricelist documents. It ingests PDF, DOCX, and TXT files, builds semantic
chunks, table-aware chunks, structured facts, reviewed tariff rows, fee rules,
source evidence, embeddings, and persistent chat history.

The main product surface is streaming chat. General document questions can use
retrieved chunks with citations. Price, route, schedule, validity, fee, and
quote answers use verified numeric mode: only reviewed active facts/rows/rules
or deterministic TypeScript calculations are trusted.

No runtime seed tariff data is included. No eval/test-question dashboard is
implemented.

## Quick Start

```bash
cp .env.example .env
bun run docker:migrate
bun run docker:dev
```

Open `http://localhost:3000`, log in at `/admin/login`, upload tariff files
from `/admin/documents`, review extracted records, then use `/chat`.

## Docker Mode

Docker local/VPS mode uses:

- Next.js app
- separate worker process
- local Postgres with pgvector
- local Redis
- local filesystem storage under `UPLOAD_ROOT`

Run the optimized production-style stack:

```bash
bun run docker:prod
```

Run the hot-reload development stack:

```bash
bun run docker:dev
```

See [docs/docker-local-vps.md](docs/docker-local-vps.md).

## Managed Fallback

Managed fallback mode uses Supabase Postgres as managed Postgres with pgvector,
Upstash Redis when compatible, or the database fallback queue. Object storage is
not required.

See [docs/managed-fallback.md](docs/managed-fallback.md).

## Verification

```bash
bun run verify
```

Browser smoke tests are opt-in because they need app services:

```bash
RUN_BROWSER_E2E=1 bun run test:e2e
```

## More Docs

- [Environment](docs/environment.md)
- [Ingestion And Review](docs/ingestion-review-flow.md)
- [Chat Usage](docs/chat-usage.md)
- [Architecture](docs/architecture.md)
- [Storage And Backup](docs/storage-backup.md)
- [Known Limitations](docs/limitations.md)
