# Managed Fallback

Managed fallback runs the Next.js app and worker as normal Node processes while
using managed infrastructure where useful.

## Database

Provision Supabase Postgres and enable the vector extension. Formalist treats
Supabase as Postgres, not as the whole backend. Supabase Auth and Supabase
Storage are not required.

```bash
DEPLOYMENT_MODE=managed-fallback
DATABASE_PROVIDER=supabase
SUPABASE_DATABASE_URL=postgres://...
bun run db:migrate
```

`DATABASE_URL` may also be used when `SUPABASE_DATABASE_URL` is not set.

## Queue

Use Upstash Redis when the configured queue behavior is compatible:

```bash
QUEUE_PROVIDER=upstash-redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

If REST Redis semantics are not sufficient for worker claims, use:

```bash
QUEUE_PROVIDER=db-fallback
```

The DB fallback queue uses `ingestion_jobs` and supports enqueue, claim, retry,
fail, and complete.

## Processes

Run app and worker separately:

```bash
bun run managed:app
bun run managed:worker
```

If optional artifacts are enabled, configure `UPLOAD_ROOT` to a persistent local
disk on the host/platform. Do not require S3, Supabase Storage, R2, or another
object store.
