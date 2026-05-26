# Environment

Copy `.env.example` to `.env` and set deployment-specific values.

## Deployment

- `DEPLOYMENT_MODE`: `self-hosted`, `docker-local`, or `managed-fallback`.
- `DATABASE_PROVIDER`: `postgres` or `supabase`.
- `DATABASE_URL`: Postgres connection URL.
- `SUPABASE_DATABASE_URL`: optional Supabase Postgres URL; preferred for
  `DATABASE_PROVIDER=supabase`.
- `QUEUE_PROVIDER`: `local-redis`, `upstash-redis`, or `db-fallback`.
- `REDIS_URL`: local Redis URL for BullMQ.
- `UPSTASH_REDIS_REST_URL`: Upstash REST URL.
- `UPSTASH_REDIS_REST_TOKEN`: Upstash REST token.
- `HOST`: host passed to `next start` by the self-hosted app script. Use
  `127.0.0.1` when running behind nginx or Caddy.
- `PORT`: app port passed to `next start` by the self-hosted app script.

Use `self-hosted` for a local non-Docker install or a single VPS with system
Postgres and Redis. Use `docker-local` only when the app runs inside Docker or
uses Docker-managed infrastructure. Use `managed-fallback` for hosted Postgres
and a degraded database-backed queue path.

## Models

- `OPENROUTER_API_KEY`: optional at boot. Required for LLM chat, extraction,
  and embeddings.
- `OPENROUTER_SITE_URL`: site URL sent to OpenRouter.
- `OPENROUTER_APP_NAME`: app name sent to OpenRouter.
- `OPENROUTER_PROVIDER_SORT`: provider routing priority, default `price`.
  Valid values are `price`, `throughput`, or `latency`.
- `OPENROUTER_PROVIDER_ORDER`: comma-separated provider slugs to try in order.
- `OPENROUTER_ONLY_PROVIDERS`: comma-separated provider slugs to allow.
- `OPENROUTER_IGNORE_PROVIDERS`: comma-separated provider slugs to skip.
- `OPENROUTER_ALLOW_FALLBACKS`: default `true`; set `false` to prevent backup
  providers.
- `OPENROUTER_REQUIRE_PARAMETERS`: default `false`; set `true` to route only
  to providers supporting every request parameter, such as tool calling or
  structured output.
- `OPENROUTER_DATA_COLLECTION`: optional `allow` or `deny`.
- `OPENROUTER_MAX_PROMPT_PRICE`: optional max prompt-token price cap passed to
  OpenRouter provider routing.
- `OPENROUTER_MAX_COMPLETION_PRICE`: optional max completion-token price cap
  passed to OpenRouter provider routing.
- `CHAT_MODEL`: defaults to `deepseek/deepseek-v4-flash`.
- `CLASSIFIER_MODEL`: defaults to `deepseek/deepseek-v4-flash`.
- `EXTRACTION_MODEL`: defaults to `deepseek/deepseek-v4-flash`.
- `EMBEDDING_MODEL`: defaults to `qwen/qwen3-embedding-8b`.
- `ENABLE_LLM_FACT_EXTRACTION`: defaults to `false`. Keep disabled unless
  deterministic extraction leaves unsupported gaps that need prose extraction.
- `ENABLE_LLM_FEE_RULE_EXTRACTION`: defaults to `false`. Enable only for
  compact note extraction after reviewing token budget.
- `ENABLE_LLM_TARIFF_EXTRACTION`: defaults to `false`. Tariff rows are
  deterministic-first; do not enable whole-document tariff extraction for
  table-shaped PDFs.
- `MAX_EXTRACTION_INPUT_TOKENS`: defaults to `8000`; extraction prompts are
  truncated to this approximate token budget before LLM calls.
- `LLM_EXTRACTION_TIMEOUT_MS`: defaults to `15000`; optional extraction falls
  back deterministically after this timeout.

## Storage

- `UPLOAD_ROOT`: local artifact root.
- `MAX_UPLOAD_MB`: upload size limit.
- `STORE_ORIGINAL_FILES`: `true` or `false`; Docker forces this to `true`.
- `STORE_PAGE_IMAGES`: `true` or `false`; Docker forces this to `true`.
- `STORE_DEBUG_ARTIFACTS`: `true` or `false`; Docker forces this to `true`.

## Security

- `ADMIN_PASSWORD`: password for the built-in admin login.
- `SESSION_SECRET`: long random signing secret.
- `NODE_ENV`: `development`, `test`, or `production`.

Never commit `.env` or real secrets.
