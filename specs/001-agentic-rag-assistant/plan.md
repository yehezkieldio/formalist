# Implementation Plan: Formalist Agentic RAG Assistant

**Branch**: `001-agentic-rag-assistant` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-agentic-rag-assistant/spec.md`

## Summary

Build the full first version of Formalist: a Next.js 16 App Router application
with a separate worker process that ingests air cargo tariff/pricelist
documents, creates semantic and table-aware memories, extracts structured facts,
requires admin review before trusted use, and powers a streaming ChatGPT-style
agentic RAG assistant. The assistant uses AI SDK v6 with OpenRouter, visible
tool calls, persistent chat history, source evidence, verified numeric mode, and
deterministic TypeScript quote calculation.

The system runs in Docker local/VPS mode with local Postgres + pgvector, local
Redis, and local filesystem artifacts, and in managed fallback mode with
Supabase Postgres + pgvector, Upstash Redis or DB fallback queue, and local
filesystem artifacts where persistent disk exists. It does not require S3,
Supabase Storage, R2, seed tariff data, or an eval dashboard.

## Technical Context

**Language/Version**: TypeScript on Node.js with Next.js 16 App Router and
React Server Components by default.

**Primary Dependencies**: Next.js 16, React, shadcn/ui, AI Elements, AI SDK v6,
`@openrouter/ai-sdk-provider`, Drizzle ORM, drizzle-kit, pgvector, BullMQ,
Upstash Redis client, Zod, React Hook Form, TanStack Table, date-fns,
lucide-react, Vitest, Playwright for browser verification, document parsers for
PDF/DOCX/TXT extraction.

**Storage**: Postgres-compatible database with pgvector and full-text indexes;
local Redis or Upstash Redis for queueing; `ingestion_jobs` DB fallback queue;
local filesystem storage under `UPLOAD_ROOT` for optional original files, page
images, and debug artifacts.

**Testing**: Vitest for unit/integration tests of server modules, retrieval,
validation, queues, and deterministic quote logic; browser/E2E verification for
async Server Component flows, chat streaming, source previews, admin review,
and responsive UI.

**Target Platform**: Docker local/VPS with app, worker, Postgres + pgvector, and
Redis; managed fallback Node.js deployment with Supabase Postgres, Upstash Redis
or DB queue fallback, separate app and worker processes, and persistent local
upload directory when artifacts are enabled.

**Project Type**: Full-stack web application plus background worker.

**Performance Goals**: First streamed chat content within 5 seconds for at
least 90% of ordinary document questions; admin can review one extracted row in
under 90 seconds; ingestion progress visible within 2 minutes after upload.

**Constraints**: Trusted numeric answers must use reviewed active facts/table
rows or deterministic calculations; raw chunks alone are never trusted numeric
truth; the app boots without `OPENROUTER_API_KEY`; artifacts are never stored
under public web root; original files/page images/debug artifacts are optional;
no managed object storage, seed tariff data, eval dashboard, Pages Router, or
third-party auth provider dependency.

**Scale/Scope**: Complete first version for a single-organization air cargo
tariff/pricelist assistant, covering chat, ingestion, review, retrieval,
aliases, quote calculation, admin settings, deployment, and documentation.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Agentic RAG Champion**: PASS. The plan centers the streaming chatbot and
  defines intent classification, tool calling, retrieval, verification,
  deterministic calculation, source citation, and persistent conversation UX.
- **Multiple Document Memories**: PASS. The ingestion design creates documents,
  pages, semantic chunks, table chunks, extracted facts, tariff rows, fee rules,
  source evidence, embeddings, chat/tool-call history, and optional artifacts.
- **Verified Numeric Mode**: PASS. Numeric answers use only reviewed active
  facts/table rows or deterministic calculations based on them. Raw chunks are
  allowed only as unverified context.
- **Human Review Before Trust**: PASS. Extracted records start as `extracted`
  or `needs_review`, then admin review activates, rejects, edits, or archives
  them with audit logs.
- **Deterministic Calculation**: PASS. Quote math lives in
  `src/server/tariff/calculator.ts` and is exercised by Vitest for minimum
  weight, fees, PPN, surcharges, and totals.
- **Source Traceability**: PASS. `chat_sources`, source preview contracts, and
  evidence helpers expose document, page, chunk/table/fact/row/rule references,
  snippets, effective dates, validity, and fee rules.
- **Product Quality**: PASS. The source tree includes chat shell, sidebar,
  message actions, prompt composer, tool-call cards, timeline, reasoning
  summaries, confidence badges, source cards, previews, markdown, responsive
  layout, and theme support.
- **Deployment And Storage**: PASS. Docker local/VPS and managed fallback modes
  are both planned with environment-selected providers and local filesystem
  artifact flags.
- **Security**: PASS. Admin session protection, environment-only secrets,
  non-public artifact paths, upload validation, and audit logging are required.
- **Modular Boundaries**: PASS. Source layout separates app routes, UI,
  server AI, DB, ingestion, queue, retrieval, tariff, chat, storage, auth,
  audit, and deployment modules.
- **Graceful Degradation**: PASS. Missing `OPENROUTER_API_KEY` disables LLM chat
  and extraction with setup-required states while deterministic admin, lookup,
  review, and calculation flows remain bootable.
- **Scope Exclusions**: PASS. Plan explicitly excludes seed tariff data and an
  eval/test-question dashboard.

## Project Structure

### Documentation (this feature)

```text
specs/001-agentic-rag-assistant/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   ├── assistant-tools.md
│   └── worker-queue.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── chat/
│   │   ├── page.tsx
│   │   └── [sessionId]/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── documents/
│   │   ├── chunks/
│   │   ├── facts/
│   │   ├── review/
│   │   ├── fee-rules/
│   │   ├── aliases/
│   │   ├── extraction-issues/
│   │   ├── audit-logs/
│   │   └── settings/
│   └── api/
│       ├── chat/
│       ├── upload/
│       ├── documents/
│       ├── chunks/
│       ├── facts/
│       ├── review/
│       ├── aliases/
│       └── settings/
├── components/
│   ├── ai/
│   ├── admin/
│   └── ui/
└── server/
    ├── ai/
    ├── audit/
    ├── auth/
    ├── chat/
    ├── db/
    ├── deployment/
    ├── ingestion/
    ├── queue/
    ├── retrieval/
    ├── storage/
    └── tariff/

tests/
├── unit/
├── integration/
└── e2e/

docker/
├── app.Dockerfile
└── worker.Dockerfile

drizzle/
└── migrations/
```

**Structure Decision**: Use a single Next.js app repository with route handlers
for BFF/API endpoints and a separate Node worker entrypoint sharing
`src/server/*` modules. This keeps UI, API, worker, ingestion, retrieval, and
calculation code in one typed codebase while preserving runtime boundaries.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| Separate worker process | Ingestion, extraction, embeddings, and artifact writes are long-running and must not block chat/API requests | Running ingestion entirely inside route handlers would make uploads brittle and conflict with managed platform request limits |
| Queue adapter with three providers | Formalist must run in Docker local/VPS mode, managed fallback mode, and Redis-unavailable mode | A single BullMQ-only queue would fail the Upstash/DB-fallback requirement and hard-code one infrastructure provider |
| Separate structured facts, tariff rows, fee rules, chunks, and table chunks | Verified numeric mode needs reviewed structured truth while general RAG still needs chunk evidence | A single chunk table would force trusted numeric answers to rely on raw text and violate the constitution |
