# Architecture

Formalist separates product surfaces from ingestion, retrieval, trust, and
deployment concerns.

## Boundaries

- `src/app`: Next.js App Router pages and route handlers.
- `src/components/ai`: chat, messages, tool calls, reasoning summaries, source
  cards, and confidence UI.
- `src/components/admin`: upload, review, aliases, settings, and admin tables.
- `src/server/ai`: OpenRouter provider, AI SDK route orchestration, prompts,
  tools, and stream serialization.
- `src/server/ingestion`: parsers, chunkers, extractors, validators, worker
  pipeline, and artifacts.
- `src/server/retrieval`: aliases, full-text search, vector search, hybrid RRF,
  structured tariff search, comparisons, destinations, and reranker interface.
- `src/server/tariff`: deterministic quote calculation, fee lookup, validation,
  formatting, and evidence.
- `src/server/queue`: local Redis, Upstash, and DB fallback adapters.
- `src/server/storage`: local filesystem storage and safe paths.

## Trust Model

General RAG may answer from cited chunks. Verified numeric mode requires active
reviewed facts, tariff rows, or fee rules. Quote totals are calculated by
TypeScript code using `decimal.js`.

## Deployment

Docker mode uses local Postgres, pgvector, Redis, app, worker, and local
uploads. Managed fallback uses Supabase Postgres, Upstash Redis or DB fallback,
separate app/worker processes, and local persistent disk for optional artifacts.
