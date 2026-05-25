# Research: Formalist Agentic RAG Assistant

## Decision: Next.js 16 App Router With Server Components By Default

**Rationale**: Next.js 16 App Router pages and layouts are Server Components by
default, which fits Formalist's data-heavy admin and source evidence pages.
Interactive surfaces such as the chat composer, stop/regenerate controls,
source preview panel, TanStack tables, upload progress, and settings forms will
be small Client Components. Route handlers under `src/app/api/**/route.ts`
handle chat streaming, uploads, review actions, settings, and lookup endpoints.

**Alternatives considered**:

- Pages Router: rejected because the user explicitly prohibited old patterns.
- Client-heavy SPA: rejected because secrets, database access, and admin data
  should stay server-side, and it would increase client bundle size.

## Decision: AI SDK v6 `streamText` With Tool Calling And UI Message Streams

**Rationale**: AI SDK v6 supports route-handler streaming through `streamText`,
tool definitions with Zod schemas, and UI message stream responses. Tool calls
can be persisted through callbacks and rendered as visible tool-call cards and
timelines in the chat UI. OpenRouter is selected through
`@openrouter/ai-sdk-provider`, with defaults `deepseek/deepseek-v4-flash` for
chat and `qwen/qwen3-embedding-8b` for embeddings.

**Alternatives considered**:

- LangChain orchestration: rejected because the required tool/citation flow is
  narrower and does not need a heavy orchestration framework. Focused LangChain
  packages such as `@langchain/textsplitters` remain acceptable where they solve
  a bounded infrastructure problem without taking over agent orchestration.
- Custom SSE protocol only: rejected because AI SDK already provides model,
  tool, and stream abstractions while allowing custom persistence.

## Decision: Modern Focused Packages For Reusable Infrastructure

**Rationale**: Formalist should not hand-roll brittle versions of generic
parsing, splitting, tool-state, or cache primitives when maintained packages
provide the same foundation. Package usage must still preserve Formalist's
review-before-trust, deterministic calculation, source evidence, and deployment
constraints.

**Selected package direction**:

- PDF parsing: `@opendataloader/pdf`.
- DOCX parsing: `officeparser`.
- Semantic text splitting: `@langchain/textsplitters`.
- AI tool state/cache: evaluate `ai-sdk-tools` or an AI SDK-native equivalent
  during AI tool orchestration implementation.

**Alternatives considered**:

- Broad LangChain orchestration: rejected for the first version because AI SDK
  is the selected streaming/tooling layer, but focused LangChain utility
  packages are allowed.
- Fully custom parsers and splitters: rejected as brittle unless Formalist's
  provenance or verification contract requires custom logic around package
  output.

## Decision: Drizzle ORM, drizzle-kit, pgvector, And Postgres Full-Text Search

**Rationale**: Drizzle provides typed PostgreSQL schema and migrations while
allowing raw SQL where pgvector, generated full-text indexes, and RRF ranking
need explicit database control. Migrations will include `CREATE EXTENSION IF NOT
EXISTS vector`, HNSW/vector indexes for embeddings, and GIN indexes for full
text search over chunk/table/fact/tariff searchable text.

**Alternatives considered**:

- Prisma: rejected because pgvector/full-text/custom SQL work is more direct
  with Drizzle for this project.
- Managed vector database: rejected by project constraints.

## Decision: Hybrid Retrieval With FTS + pgvector + RRF

**Rationale**: Air cargo pricelists require both semantic recall and exact-ish
matching for cities, airport codes, airlines, dates, and fee phrases. Retrieval
will run full-text search and vector search independently, normalize ranks with
reciprocal rank fusion, then optionally rerank through a provider abstraction.
Verified numeric mode then filters to reviewed active structured records.

**Alternatives considered**:

- Vector-only retrieval: rejected because city/code and tariff rows require
  precise lexical matching.
- FTS-only retrieval: rejected because summaries and prose Q&A need semantic
  recall across varied document wording.

## Decision: Multi-Layer Document Memory

**Rationale**: Each document produces semantic chunks for general RAG,
table-aware chunks for row/section evidence, structured facts for reviewable
claims, tariff rows for numeric price/route answers, fee rules for quote math,
source metadata for audit, and embeddings for retrieval. This is the minimum
shape that supports both general RAG mode and verified numeric mode.

**Alternatives considered**:

- Single `chunks` table: rejected because it cannot enforce reviewed numeric
  truth or table row lineage.
- Direct table extraction only: rejected because non-numeric document Q&A still
  needs narrative chunks.

## Decision: Human Review State Machine For Trusted Facts

**Rationale**: Extracted records start as `extracted` or `needs_review`; admin
actions move them to `active`, `rejected`, or `archived`. Numeric tools only
query `active` rows/facts/rules. Review decisions write audit logs and keep
source evidence visible.

**Alternatives considered**:

- Auto-activation above confidence threshold: rejected because the constitution
  requires human review before trust.
- Soft warnings while still using unreviewed data: rejected for trusted numeric
  answers because it risks silent price errors.

## Decision: Deterministic Quote Calculator In TypeScript

**Rationale**: The calculator owns billable weight, minimum weight, base SMU
cost, admin fee, warehouse fee, warehouse admin fee, surcharges, PPN, and total.
The LLM calls `calculateQuote` and explains returned results; it never performs
the math. Tests cover minimum weight, PPN, missing fee rules, promo/regular
ambiguity, and source evidence propagation.

**Alternatives considered**:

- LLM-calculated totals: rejected because calculations must be repeatable and
  auditable.
- Spreadsheet-style formula storage for v1: deferred because current fee rules
  can be represented as typed records and deterministic functions.

## Decision: Queue Adapter With Local Redis, Upstash Redis, And DB Fallback

**Rationale**: Local Docker/VPS uses BullMQ with Redis for robust workers,
attempts, backoff, and concurrency. Managed fallback selects Upstash Redis
through `QUEUE_PROVIDER=upstash-redis` when compatible. If a BullMQ feature is
incompatible with Upstash REST semantics or Redis is unavailable, the adapter
uses `ingestion_jobs` with enqueue, claim, retry, fail, complete, attempts, and
visibility timing.

**Alternatives considered**:

- BullMQ only: rejected because Upstash compatibility may not cover every worker
  feature and DB fallback is required.
- Database queue only: rejected because local Redis/BullMQ is better for
  concurrent ingestion and retry behavior.

## Decision: Local Filesystem Artifact Storage Only

**Rationale**: Original files, page images, and debug artifacts are optional and
stored under `UPLOAD_ROOT`, never under `public/`. The app keeps working from
database text, chunks, facts, and metadata when file storage is disabled.

**Alternatives considered**:

- S3/R2/Supabase Storage: rejected by first-version constraints.
- Mandatory file retention: rejected because the constitution says file storage
  is optional and the core system must work from stored text and metadata.

## Decision: Simple Admin Session Auth For V1

**Rationale**: Admin routes need protection without depending on third-party
auth. V1 uses `ADMIN_PASSWORD` and `SESSION_SECRET` to establish a signed admin
session cookie. This can be replaced later behind `src/server/auth/*` without
changing admin pages.

**Alternatives considered**:

- Supabase Auth: rejected because Supabase is only a Postgres fallback provider
  in this project.
- No auth in local mode: rejected because admin routes must be protected.

## Decision: Test Split Between Vitest And Browser Verification

**Rationale**: Vitest covers deterministic modules, queue adapters, retrieval,
validation, parsing helpers, status transitions, and calculation. Browser/E2E
tests cover async Server Component pages, chat streaming, source preview,
admin review, upload progress, theme/responsive layout, and auth protection.

**Alternatives considered**:

- Vitest-only UI coverage: rejected because current Next.js guidance recommends
  E2E tests for async Server Components.
- Manual-only UI verification: rejected because chat/admin workflows are core
  product quality gates.
