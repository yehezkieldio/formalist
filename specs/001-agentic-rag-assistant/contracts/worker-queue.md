# Worker And Queue Contract

The worker process shares `src/server/*` modules with the app but runs as a
separate Node.js process. Queue behavior is accessed only through
`src/server/queue/adapter.ts`.

## Queue Adapter Interface

```ts
interface QueueAdapter<TPayload = unknown> {
  enqueue(input: EnqueueJobInput<TPayload>): Promise<QueuedJob>
  claim(options: ClaimOptions): Promise<ClaimedJob<TPayload> | null>
  complete(jobId: string, output?: unknown): Promise<void>
  fail(jobId: string, error: Error, options?: FailOptions): Promise<void>
  retry(jobId: string, options?: RetryOptions): Promise<void>
}
```

## Providers

### local-redis

- Selected by `QUEUE_PROVIDER=local-redis`.
- Uses BullMQ and `REDIS_URL`.
- Supports attempts, backoff, concurrency, delayed retries, and worker events.
- Also writes or updates `ingestion_jobs` as audit trail.

### upstash-redis

- Selected by `QUEUE_PROVIDER=upstash-redis`.
- Uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Must use the adapter boundary so incompatible BullMQ features can be avoided.
- If required worker semantics cannot be provided safely, configuration should
  fail fast or use `db-fallback` with a documented warning.

### db-fallback

- Selected by `QUEUE_PROVIDER=db-fallback` or when Redis is unavailable and
  fallback is explicitly allowed.
- Uses `ingestion_jobs`.
- Must support enqueue, claim, retry, fail, complete, attempts, max attempts,
  available-at scheduling, and stale-running-job recovery.

## Job Types

### parse-document

Input:

```json
{
  "documentId": "uuid"
}
```

Steps:
- Load document metadata and optional original path.
- Parse PDF, DOCX, or TXT.
- Store page text records.
- Write debug artifact only when enabled.
- Move document to `parsing` then enqueue `chunk-document`.

### chunk-document

Input:

```json
{
  "documentId": "uuid"
}
```

Steps:
- Create semantic chunks.
- Create table-aware chunks.
- Include page, section, table, row, headers, and metadata.
- Move document to `chunked`.
- Enqueue `extract-structured-data`.

### extract-structured-data

Input:

```json
{
  "documentId": "uuid"
}
```

Steps:
- Extract document metadata, facts, tariff rows, and fee rules.
- Set extracted records to `extracted` or `needs_review`.
- Create raw evidence links.
- Move document to `extracted`.
- Enqueue `validate-extraction` and `embed-sources`.

### validate-extraction

Input:

```json
{
  "documentId": "uuid"
}
```

Steps:
- Run validators for missing price, N/A price, invalid price format, missing
  airline/destination/code, city/code mismatch, ambiguous aliases, duplicates,
  promo/regular conflicts, expired validity, missing validity, missing fee
  rules, low confidence, and source mismatch.
- Create extraction issues.
- Move document to `needs_review` when reviewable records exist.

### embed-sources

Input:

```json
{
  "documentId": "uuid",
  "ownerTypes": ["document_chunk", "table_chunk", "extracted_fact", "tariff_row"]
}
```

Steps:
- Generate embeddings through configured embedding model when available.
- If the model key is missing, mark embedding generation setup-required without
  blocking non-LLM review and deterministic flows.
- Upsert `embeddings` rows.

## Failure Rules

- Retry transient parser, database, queue, and provider failures while attempts
  remain.
- Mark jobs failed and documents failed when max attempts are exhausted.
- Do not activate extracted data automatically after retries.
- Persist error text in `ingestion_jobs.error` and `documents.ingestion_error`.

## Worker Health

Worker health endpoint or command reports:
- queue provider
- database connectivity
- model key availability
- upload root writability
- pending/running/failed job counts
- last successful job time
