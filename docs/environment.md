# Environment

Copy `.env.example` to `.env` and set deployment-specific values.

## Deployment

- `DEPLOYMENT_MODE`: `docker-local` or `managed-fallback`.
- `DATABASE_PROVIDER`: `postgres` or `supabase`.
- `DATABASE_URL`: Postgres connection URL.
- `SUPABASE_DATABASE_URL`: optional Supabase Postgres URL; preferred for
  `DATABASE_PROVIDER=supabase`.
- `QUEUE_PROVIDER`: `local-redis`, `upstash-redis`, or `db-fallback`.
- `REDIS_URL`: local Redis URL for BullMQ.
- `UPSTASH_REDIS_REST_URL`: Upstash REST URL.
- `UPSTASH_REDIS_REST_TOKEN`: Upstash REST token.

## Models

- `OPENROUTER_API_KEY`: optional at boot. Required for LLM chat, extraction,
  and embeddings.
- `OPENROUTER_SITE_URL`: site URL sent to OpenRouter.
- `OPENROUTER_APP_NAME`: app name sent to OpenRouter.
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
