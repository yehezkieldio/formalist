# Quickstart: Formalist

## Prerequisites

- Bun
- Docker and Docker Compose for local/VPS mode
- Node.js runtime compatible with Next.js 16 for managed fallback mode
- OpenRouter API key for LLM chat and extraction
- Persistent local directory for uploads when artifact storage is enabled

## Environment

Create `.env.local` from the documented variables:

```bash
DEPLOYMENT_MODE=docker-local
DATABASE_PROVIDER=postgres
DATABASE_URL=postgres://formalist:formalist@localhost:5432/formalist
QUEUE_PROVIDER=local-redis
REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Formalist
CHAT_MODEL=deepseek/deepseek-v4-flash
EMBEDDING_MODEL=qwen/qwen3-embedding-8b
UPLOAD_ROOT=/data/uploads
MAX_UPLOAD_MB=50
STORE_ORIGINAL_FILES=false
STORE_PAGE_IMAGES=false
STORE_DEBUG_ARTIFACTS=false
ADMIN_PASSWORD=change-me
SESSION_SECRET=change-me-to-a-long-random-value
NODE_ENV=development
```

## Docker Local/VPS Mode

1. Start Postgres with pgvector and Redis:

   ```bash
   docker compose up -d postgres redis
   ```

2. Run migrations:

   ```bash
   bun run db:migrate
   ```

3. Start the app and worker:

   ```bash
   docker compose up app worker
   ```

4. Open the app at `http://localhost:3000`.

5. Log in to admin with `ADMIN_PASSWORD`.

6. Upload a real PDF, DOCX, or TXT tariff/pricelist document.

7. Watch ingestion status until chunks, table chunks, extracted facts, tariff
   rows, fee rules, and extraction issues appear.

8. Review extracted rows/rules/facts. Activate only verified records.

9. Ask chat questions such as:

   ```text
   Harga Pelita ke Surabaya berapa?
   Kalau 20 kg ke Surabaya pakai Pelita total berapa?
   Ringkas isi dokumen ini
   Tampilkan sumber harga ini dari file mana dan halaman berapa
   ```

## Managed Fallback Mode

1. Provision Supabase Postgres.

2. Enable the vector extension in Supabase Postgres.

3. Set:

   ```bash
   DEPLOYMENT_MODE=managed-fallback
   DATABASE_PROVIDER=supabase
   DATABASE_URL=<supabase-postgres-connection-string>
   SUPABASE_DATABASE_URL=<optional-same-or-admin-connection-string>
   ```

4. Run Drizzle migrations against the Supabase connection string:

   ```bash
   bun run db:migrate
   ```

5. Provision Upstash Redis.

6. Set:

   ```bash
   QUEUE_PROVIDER=upstash-redis
   UPSTASH_REDIS_REST_URL=<url>
   UPSTASH_REDIS_REST_TOKEN=<token>
   ```

7. If the selected queue behavior is incompatible with Upstash REST semantics,
   switch to:

   ```bash
   QUEUE_PROVIDER=db-fallback
   ```

8. Configure a persistent local upload directory if original files, page images,
   or debug artifacts are enabled.

9. Start the app and worker as separate Node.js processes:

   ```bash
   bun run start
   bun run worker
   ```

## Missing OpenRouter Key Behavior

Formalist must boot without `OPENROUTER_API_KEY`. In that state:

- Admin pages load.
- Stored documents, chunks, facts, review, aliases, audit logs, and settings
  remain available.
- Deterministic lookup and quote calculation remain available when reviewed
  active data exists.
- LLM chat and LLM extraction show setup-required states.

## Upload And Review Flow

1. Upload document.
2. Worker parses text/page text.
3. Worker creates semantic chunks and table chunks.
4. Worker extracts structured facts, tariff rows, and fee rules.
5. Worker validates issues.
6. Admin reviews and edits extracted records.
7. Admin activates trusted rows/rules/facts.
8. Chat uses active records for verified numeric answers.

## Backup Notes

- Back up Postgres regularly.
- Back up `UPLOAD_ROOT` only if original files, page images, or debug artifacts
  are enabled and must be retained.
- The app must continue to work from database text, chunks, facts, and source
  metadata when original file storage is disabled.

## Explicit Limitations

- No seed tariff data is required or provided.
- No eval/test-question dashboard is implemented.
- No S3, Supabase Storage, R2, or managed object storage is required.
- Scanned-only PDFs without extractable text may require future OCR support.
