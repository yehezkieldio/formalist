# Tasks: Formalist Agentic RAG Assistant

**Input**: Design documents from `/specs/001-agentic-rag-assistant/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), [contracts/](./contracts/)

**Scope**: Complete first version of Formalist. Do not add seed tariff data. Do not add an eval/test-question dashboard.

**Format**: `- [ ] T### [P?] Description with file path; Dependencies: ...; Acceptance: ...`

## Phase 1: Foundation

- [x] T001 Initialize the Next.js 16 TypeScript App Router project structure in `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, and `src/app/page.tsx`; Dependencies: none; Acceptance: `bun install` succeeds and `bun run dev` starts a blank App Router shell.
- [x] T002 [P] Configure Ultracite, TypeScript strictness, path aliases, and formatting scripts in `package.json`, `tsconfig.json`, `components.json`, and `biome.json` or Ultracite-managed config; Dependencies: T001; Acceptance: `bun x ultracite check` runs without configuration errors.
- [x] T003 [P] Install and initialize Tailwind, shadcn/ui, and base UI primitives in `components.json`, `src/app/globals.css`, and `src/components/ui/`; Dependencies: T001; Acceptance: a shadcn button renders on `src/app/page.tsx`.
- [x] T004 [P] Install AI Elements and create initial AI component wrappers in `src/components/ai/ai-elements-provider.tsx` and `src/components/ai/index.ts`; Dependencies: T001; Acceptance: AI Elements imports compile without client/server boundary errors.
- [x] T005 [P] Install AI SDK v6 and `@openrouter/ai-sdk-provider` and create package scripts in `package.json`; Dependencies: T001; Acceptance: `bun run typecheck` resolves AI SDK and OpenRouter imports.
- [x] T006 [P] Install Drizzle ORM, drizzle-kit, PostgreSQL client, and pgvector-compatible dependencies in `package.json` and `drizzle.config.ts`; Dependencies: T001; Acceptance: `bun run db:generate` can locate schema config once schema is added.
- [x] T007 [P] Install queue, validation, form, table, date, icon, test, and parser dependencies in `package.json`; Dependencies: T001; Acceptance: imports for BullMQ, Upstash Redis, Zod, React Hook Form, TanStack Table, date-fns, lucide-react, Vitest, PDF, DOCX, and TXT parsing compile.
- [x] T008 Create environment validation with t3 env in `src/env.ts`; Dependencies: T001; Acceptance: invalid `DEPLOYMENT_MODE`, `DATABASE_PROVIDER`, `QUEUE_PROVIDER`, booleans, and required secrets produce typed startup validation errors.
- [x] T009 [P] Create `.env.example` with every required environment variable in `.env.example`; Dependencies: T008; Acceptance: `.env.example` includes Docker and managed fallback examples without real secrets.
- [x] T010 Configure root scripts for app, worker, migrations, tests, lint, typecheck, and managed fallback in `package.json`; Dependencies: T001, T006, T007; Acceptance: `bun run` lists `dev`, `build`, `start`, `worker`, `db:generate`, `db:migrate`, `test`, `test:integration`, `test:e2e`, `typecheck`, and `lint`.
- [x] T011 Create Docker Compose services for app, worker, Postgres with pgvector, Redis, and upload volume in `docker-compose.yml`, `docker/app.Dockerfile`, and `docker/worker.Dockerfile`; Dependencies: T010; Acceptance: `docker compose config` validates all services and volumes.
- [x] T012 Create non-Docker managed fallback start scripts in `scripts/start-managed-app.sh` and `scripts/start-managed-worker.sh`; Dependencies: T010; Acceptance: scripts document required env and invoke app and worker as separate Node processes.

## Phase 2: Deployment Adapters

- [x] T013 Create deployment mode parser in `src/server/deployment/mode.ts`; Dependencies: T008; Acceptance: unit tests cover `docker-local`, `managed-fallback`, invalid values, and defaults.
- [x] T014 Create database provider selector in `src/server/db/provider.ts`; Dependencies: T013; Acceptance: local Postgres uses `DATABASE_URL`, Supabase uses `SUPABASE_DATABASE_URL` when present and falls back to `DATABASE_URL`.
- [x] T015 Create database client factory in `src/server/db/index.ts`; Dependencies: T014; Acceptance: server modules can import a typed Drizzle client without reading env outside provider code.
- [x] T016 Create queue provider selector in `src/server/queue/provider.ts`; Dependencies: T013; Acceptance: `QUEUE_PROVIDER` resolves to `local-redis`, `upstash-redis`, or `db-fallback` with clear unsupported-combination errors.
- [x] T017 Create upload root and storage settings health probes in `src/server/deployment/health.ts`; Dependencies: T008; Acceptance: probe reports upload root missing, unwritable, or inside public web root.
- [x] T018 Create database, pgvector extension, full-text index, queue, and OpenRouter health checks in `src/server/deployment/health.ts`; Dependencies: T014, T016; Acceptance: health output includes database connectivity, vector extension availability, queue status, upload root status, storage flags, and model key availability.
- [x] T019 [P] Add deployment config tests in `tests/unit/deployment/mode.test.ts` and `tests/unit/deployment/health.test.ts`; Dependencies: T013, T018; Acceptance: tests verify missing OpenRouter key is a degraded state rather than startup failure.

## Phase 3: Database And Migrations

- [x] T020 Create Drizzle status enum constants and common timestamp helpers in `src/server/db/schema.ts`; Dependencies: T006; Acceptance: enums match `data-model.md` and compile as const values.
- [x] T021 Create document, page, chunk, and table chunk tables in `src/server/db/schema.ts`; Dependencies: T020; Acceptance: schema exposes `documents`, `documentPages`, `documentChunks`, and `tableChunks` with required columns and relations.
- [x] T022 Create extracted facts, tariff rows, fee rules, aliases, and embeddings tables in `src/server/db/schema.ts`; Dependencies: T020, T021; Acceptance: schema includes review statuses, source references, and pgvector embedding column.
- [x] T023 Create extraction issue, chat session, chat message, tool call, chat source, verification, settings, audit log, and ingestion job tables in `src/server/db/schema.ts`; Dependencies: T020; Acceptance: schema covers every table listed in `data-model.md`.
- [x] T024 Create Drizzle relation definitions in `src/server/db/relations.ts`; Dependencies: T021, T022, T023; Acceptance: documents relate to pages, chunks, facts, rows, rules, issues, jobs, and audit logs.
- [x] T025 Create custom migration for pgvector extension in `drizzle/migrations/0000_create_vector_extension.sql`; Dependencies: T006; Acceptance: migration contains `CREATE EXTENSION IF NOT EXISTS vector`.
- [x] T026 Create generated or hand-authored initial migration for all tables in `drizzle/migrations/0001_initial_schema.sql`; Dependencies: T021, T022, T023, T025; Acceptance: migration creates all tables without seed tariff rows.
- [x] T027 Create vector HNSW indexes and owner uniqueness indexes in `drizzle/migrations/0002_embedding_indexes.sql`; Dependencies: T026; Acceptance: migration indexes `embeddings.embedding` with cosine operator and `(owner_type, owner_id)`.
- [x] T028 Create Postgres full-text GIN indexes for chunks, table chunks, facts, tariff rows, and fee rules in `drizzle/migrations/0003_full_text_indexes.sql`; Dependencies: T026; Acceptance: migration adds full-text indexes over searchable text fields.
- [x] T029 Create database query barrel without broad client exports in `src/server/db/queries/index.ts`; Dependencies: T015, T024; Acceptance: query modules import explicitly and avoid client bundle exposure.
- [x] T030 Create document and ingestion job query helpers in `src/server/db/queries/documents.ts` and `src/server/db/queries/ingestion-jobs.ts`; Dependencies: T021, T023; Acceptance: helpers cover create, status update, list, detail, and job status operations.
- [x] T031 Create review, alias, settings, chat, and audit query helpers in `src/server/db/queries/review.ts`, `aliases.ts`, `settings.ts`, `chat.ts`, and `audit.ts`; Dependencies: T022, T023; Acceptance: helpers enforce active-only numeric lookup and audit mutation support.
- [x] T032 Add local and Supabase migration verification scripts in `scripts/verify-local-db.sh` and `scripts/verify-supabase-db.sh`; Dependencies: T025, T026, T027, T028; Acceptance: scripts run migrations and check pgvector extension without creating seed data.
- [x] T033 Create dev reset script in `scripts/reset-dev-db.sh`; Dependencies: T026; Acceptance: script resets schema only and explicitly does not insert seed tariff data.
- [x] T034 [P] Add database schema tests in `tests/integration/db/schema.test.ts`; Dependencies: T026, T027, T028; Acceptance: tests verify tables, required indexes, vector extension, and no seed tariff rows.

## Phase 4: Local Storage

- [ ] T035 Create safe path utilities in `src/server/storage/paths.ts`; Dependencies: T008; Acceptance: utilities reject traversal, public-root paths, and paths outside `UPLOAD_ROOT`.
- [ ] T036 Create upload root initialization and writability checks in `src/server/storage/local.ts`; Dependencies: T035; Acceptance: startup can create required directories or return a persistence warning.
- [ ] T037 Create checksum generation helpers in `src/server/storage/checksum.ts`; Dependencies: T035; Acceptance: tests verify stable checksums for buffers and streams.
- [ ] T038 Create original file save/read/delete helpers in `src/server/storage/local.ts`; Dependencies: T035, T036, T037; Acceptance: helpers respect `STORE_ORIGINAL_FILES` and never write under public root.
- [ ] T039 Create page image, extracted raw JSON, and debug artifact path helpers in `src/server/ingestion/artifacts.ts`; Dependencies: T035, T036; Acceptance: helpers respect `STORE_PAGE_IMAGES` and `STORE_DEBUG_ARTIFACTS`.
- [ ] T040 [P] Add storage tests in `tests/unit/storage/paths.test.ts`, `checksum.test.ts`, and `local.test.ts`; Dependencies: T035, T036, T037, T038, T039; Acceptance: tests cover disabled storage, path traversal, unwritable root warnings, and delete behavior.

## Phase 5: Admin Auth

- [ ] T041 Create admin session signing and verification in `src/server/auth/admin-session.ts`; Dependencies: T008; Acceptance: sessions use `ADMIN_PASSWORD` and `SESSION_SECRET` and reject invalid signatures.
- [ ] T042 Create login and logout route handlers in `src/app/api/admin/login/route.ts` and `src/app/api/admin/logout/route.ts`; Dependencies: T041; Acceptance: login sets an httpOnly session cookie and logout clears it.
- [ ] T043 Create protected admin layout in `src/app/admin/layout.tsx`; Dependencies: T041; Acceptance: unauthenticated admin requests redirect to login or return unauthorized.
- [ ] T044 Create admin login page in `src/app/admin/login/page.tsx`; Dependencies: T042; Acceptance: invalid password shows an accessible error and valid login reaches admin dashboard.
- [ ] T045 Add auth server checks for admin route handlers in `src/server/auth/require-admin.ts`; Dependencies: T041; Acceptance: every admin API route can call a shared guard.
- [ ] T046 [P] Add auth tests in `tests/unit/auth/admin-session.test.ts` and `tests/e2e/admin-auth.spec.ts`; Dependencies: T041, T042, T043, T044; Acceptance: tests cover login, logout, protected layout, and unauthorized API access.

## Phase 6: Document Upload

- [ ] T047 Create upload form UI in `src/app/admin/documents/page.tsx` and `src/components/admin/document-upload-form.tsx`; Dependencies: T003, T043; Acceptance: admin can choose PDF/DOCX/TXT file and artifact flags.
- [ ] T048 Create upload validation schemas in `src/server/ingestion/upload-schema.ts`; Dependencies: T008; Acceptance: schema validates MIME type, extension, max size, metadata, and storage flags.
- [ ] T049 Create document creation service in `src/server/ingestion/documents.ts`; Dependencies: T030, T037; Acceptance: service creates document with checksum, status `uploaded`, source metadata, and storage flags.
- [ ] T050 Create upload API route in `src/app/api/upload/route.ts`; Dependencies: T045, T048, T049, T038; Acceptance: route stores optional original file, creates document, enqueues ingestion, and returns document/job IDs.
- [ ] T051 Add non-stored file extraction handoff support in `src/server/ingestion/upload-buffer.ts`; Dependencies: T050; Acceptance: when original storage is disabled, upload bytes remain available long enough for initial parse job or a controlled error explains unsupported deployment.
- [ ] T052 Create upload progress and error UI in `src/components/admin/document-upload-status.tsx`; Dependencies: T047, T050; Acceptance: admin sees queued, parsing, failed, and completed states.
- [ ] T053 [P] Add upload tests in `tests/integration/upload/upload-route.test.ts` and `tests/e2e/document-upload.spec.ts`; Dependencies: T047, T048, T049, T050, T052; Acceptance: tests cover file validation, optional storage, enqueue, and admin error states.

## Phase 7: Ingestion Queue And Worker

- [ ] T054 Create queue adapter types in `src/server/queue/adapter.ts`; Dependencies: T016, T023; Acceptance: interface supports enqueue, claim, complete, fail, retry, attempts, and payload typing.
- [ ] T055 Create local Redis BullMQ adapter in `src/server/queue/local-redis.ts`; Dependencies: T054; Acceptance: adapter supports attempts, backoff, concurrency, and writes ingestion job audit state.
- [ ] T056 Create Upstash Redis adapter in `src/server/queue/upstash-redis.ts`; Dependencies: T054; Acceptance: adapter implements compatible enqueue/claim semantics or returns explicit fallback-required errors.
- [ ] T057 Create database fallback queue adapter in `src/server/queue/db-fallback.ts`; Dependencies: T030, T054; Acceptance: adapter supports enqueue, claim, retry, fail, complete, max attempts, and stale running job recovery.
- [ ] T058 Create queue adapter factory in `src/server/queue/index.ts`; Dependencies: T055, T056, T057; Acceptance: provider selection returns the configured adapter and clear warnings for fallback.
- [ ] T059 Create worker entrypoint in `src/server/ingestion/worker.ts` and `src/worker.ts`; Dependencies: T058; Acceptance: `bun run worker` claims and processes ingestion jobs.
- [ ] T060 Create worker pipeline dispatch in `src/server/ingestion/pipeline.ts`; Dependencies: T059; Acceptance: dispatch supports parse-document, chunk-document, extract-structured-data, validate-extraction, and embed-sources job types.
- [ ] T061 Add ingestion status update helpers in `src/server/ingestion/status.ts`; Dependencies: T030, T060; Acceptance: document status transitions match `data-model.md`.
- [ ] T062 Add retry and error handling policy in `src/server/ingestion/errors.ts`; Dependencies: T057, T060, T061; Acceptance: transient failures retry and exhausted failures mark job/document failed.
- [ ] T063 Wire worker service into Docker and managed scripts in `docker-compose.yml`, `docker/worker.Dockerfile`, and `scripts/start-managed-worker.sh`; Dependencies: T059; Acceptance: Docker and non-Docker worker commands start the same entrypoint.
- [ ] T064 [P] Add queue adapter tests in `tests/unit/queue/local-redis.test.ts`, `upstash-redis.test.ts`, and `db-fallback.test.ts`; Dependencies: T055, T056, T057, T058; Acceptance: tests cover enqueue, claim, retry, fail, complete, and provider selection.

## Phase 8: Parsers

- [ ] T065 Create parser result types in `src/server/ingestion/parsers/types.ts`; Dependencies: T060; Acceptance: types include raw text, page text, table-like blocks, metadata, and warnings.
- [ ] T066 Create TXT parser in `src/server/ingestion/parsers/txt.ts`; Dependencies: T065; Acceptance: parser returns document text, synthetic page/source metadata, and line ranges.
- [ ] T067 Create DOCX parser in `src/server/ingestion/parsers/docx.ts`; Dependencies: T065; Acceptance: parser extracts paragraphs, table-like text, metadata, and warnings.
- [ ] T068 Create PDF parser in `src/server/ingestion/parsers/pdf.ts`; Dependencies: T065; Acceptance: parser extracts page text and preserves page numbers for source evidence.
- [ ] T069 Create table-like extraction fallback in `src/server/ingestion/parsers/table-like.ts`; Dependencies: T066, T067, T068; Acceptance: parser detects repeated delimiters, row-like blocks, headers, and N/A rows.
- [ ] T070 Create parser dispatcher in `src/server/ingestion/parsers/index.ts`; Dependencies: T066, T067, T068, T069; Acceptance: dispatcher chooses by file type and returns controlled errors for unsupported or scanned-only files.
- [ ] T071 Create page persistence step in `src/server/ingestion/persist-pages.ts`; Dependencies: T030, T070; Acceptance: page records are inserted with page numbers and raw text when available.
- [ ] T072 Add debug artifact persistence in `src/server/ingestion/artifacts.ts`; Dependencies: T039, T070; Acceptance: raw parse JSON is saved only when debug artifacts are enabled.
- [ ] T073 [P] Add parser tests in `tests/unit/ingestion/parsers/txt.test.ts`, `docx.test.ts`, `pdf.test.ts`, and `table-like.test.ts`; Dependencies: T066, T067, T068, T069; Acceptance: tests cover raw text, pages, table-like fallback, unsupported files, and debug artifact gating.

## Phase 9: Chunking

- [ ] T074 Create document chunker in `src/server/ingestion/chunkers/document-chunker.ts`; Dependencies: T065, T071; Acceptance: chunker creates narrative, note, heading, mixed, or unknown chunks with stable chunk indexes.
- [ ] T075 Create table-aware chunker in `src/server/ingestion/chunkers/table-chunker.ts`; Dependencies: T069, T071; Acceptance: chunker creates row/table chunks with header text, row text, markdown, table index, and row index.
- [ ] T076 Create chunk metadata builder in `src/server/ingestion/chunkers/metadata.ts`; Dependencies: T074, T075; Acceptance: metadata includes page, section title, table id, row number, nearby headers, and source document id.
- [ ] T077 Create nearby note and footnote association in `src/server/ingestion/chunkers/notes.ts`; Dependencies: T074, T075; Acceptance: row chunks include relevant surrounding notes without duplicating unrelated text.
- [ ] T078 Create chunk persistence in `src/server/ingestion/persist-chunks.ts`; Dependencies: T021, T074, T076; Acceptance: semantic chunks persist with metadata and status `active`.
- [ ] T079 Create table chunk persistence in `src/server/ingestion/persist-table-chunks.ts`; Dependencies: T021, T075, T076, T077; Acceptance: table chunks persist with status `extracted` or `needs_review`.
- [ ] T080 Wire parse and chunk jobs in `src/server/ingestion/pipeline.ts`; Dependencies: T060, T070, T071, T078, T079; Acceptance: parse-document enqueues chunk-document and chunk-document updates document status to `chunked`.
- [ ] T081 [P] Add chunker tests in `tests/unit/ingestion/chunkers/document-chunker.test.ts`, `table-chunker.test.ts`, `metadata.test.ts`, and `notes.test.ts`; Dependencies: T074, T075, T076, T077; Acceptance: tests cover page preservation, row/header association, footnotes, and chunk persistence payloads.

## Phase 10: LLM Extraction

- [ ] T082 Create OpenRouter provider setup in `src/server/ai/provider.ts`; Dependencies: T005, T008; Acceptance: provider uses `@openrouter/ai-sdk-provider` and returns setup-required state when key is missing.
- [ ] T083 Create model configuration helpers in `src/server/ai/models.ts`; Dependencies: T082; Acceptance: default chat model is `deepseek/deepseek-v4-flash` and default embedding model is `qwen/qwen3-embedding-8b`.
- [ ] T084 Create structured extraction schemas in `src/server/ingestion/extractors/schemas.ts`; Dependencies: T007; Acceptance: Zod schemas cover document metadata, facts, tariff rows, fee rules, confidence, and raw evidence.
- [ ] T085 Create document metadata extractor in `src/server/ingestion/extractors/document-metadata.ts`; Dependencies: T082, T084; Acceptance: extractor returns origin, dates, validity, promo, airline, commodity, and source confidence.
- [ ] T086 Create fact extractor in `src/server/ingestion/extractors/facts.ts`; Dependencies: T082, T084; Acceptance: extractor returns fact types listed in the data model with source chunk/table references.
- [ ] T087 Create tariff row extractor in `src/server/ingestion/extractors/tariff-rows.ts`; Dependencies: T082, T084; Acceptance: extractor returns airline, destination, route, flight, price status, schedule, validity, promo, raw row, and confidence.
- [ ] T088 Create fee rule extractor in `src/server/ingestion/extractors/fee-rules.ts`; Dependencies: T082, T084; Acceptance: extractor returns admin, warehouse, min weight, PPN, surcharge, notes, and source references.
- [ ] T089 Create extracted record persistence in `src/server/ingestion/persist-extracted.ts`; Dependencies: T022, T085, T086, T087, T088; Acceptance: extracted records persist as `extracted` or `needs_review` and never `active`.
- [ ] T090 Create missing-key and retry policy in `src/server/ingestion/extractors/policy.ts`; Dependencies: T082, T062; Acceptance: missing OpenRouter key marks extraction setup-required without crashing non-LLM workflows.
- [ ] T091 Wire extract-structured-data job in `src/server/ingestion/pipeline.ts`; Dependencies: T060, T089, T090; Acceptance: extraction job writes records, updates document status, and enqueues validation and embedding jobs.
- [ ] T092 [P] Add extraction tests in `tests/unit/ingestion/extractors/schemas.test.ts` and `tests/integration/ingestion/extraction-policy.test.ts`; Dependencies: T084, T089, T090; Acceptance: tests cover schema validation, status defaults, missing key behavior, and no auto-activation.

## Phase 11: Normalization And Validation

- [ ] T093 Create price parser in `src/server/ingestion/normalizers/price.ts`; Dependencies: T087; Acceptance: parser handles IDR formats, separators, N/A, missing, and invalid price strings.
- [ ] T094 Create airline normalizer in `src/server/ingestion/normalizers/airline.ts`; Dependencies: T025; Acceptance: normalizer trims aliases, preserves canonical values, and flags unknown airlines.
- [ ] T095 Create city and airport code normalizer in `src/server/ingestion/normalizers/city-code.ts`; Dependencies: T025; Acceptance: normalizer handles Jogja/YIA/JOG ambiguity and city/code mismatch signals.
- [ ] T096 Create route normalizer in `src/server/ingestion/normalizers/route.ts`; Dependencies: T087; Acceptance: normalizer maps direct/transit/any/unknown and preserves transit routes.
- [ ] T097 Create date and validity parser in `src/server/ingestion/normalizers/date.ts`; Dependencies: T085; Acceptance: parser handles effective date, valid from/until, missing dates, and expired validity warnings.
- [ ] T098 Create promo propagation helper in `src/server/ingestion/normalizers/promo.ts`; Dependencies: T085, T087; Acceptance: document/table promo context propagates to rows without overriding explicit row values.
- [ ] T099 Create duplicate detector in `src/server/ingestion/validators/duplicates.ts`; Dependencies: T087, T089; Acceptance: detector flags duplicate airline/destination/route/validity/promo rows.
- [ ] T100 Create city/code mismatch and ambiguous alias validators in `src/server/ingestion/validators/location.ts`; Dependencies: T095; Acceptance: validators create high or medium severity issues as appropriate.
- [ ] T101 Create extracted fact and tariff row validators in `src/server/ingestion/validators/facts.ts` and `tariff-rows.ts`; Dependencies: T093, T094, T095, T096, T097, T098, T099, T100; Acceptance: validators cover every issue type from the spec.
- [ ] T102 Create fee rule validator in `src/server/ingestion/validators/fee-rules.ts`; Dependencies: T088, T097; Acceptance: validator flags missing fee rules, invalid values, and low-confidence fee extraction.
- [ ] T103 Create extraction issue writer in `src/server/ingestion/validators/issues.ts`; Dependencies: T023, T101, T102; Acceptance: issues persist with source type/id, severity, message, and status `open`.
- [ ] T104 Wire validate-extraction job in `src/server/ingestion/pipeline.ts`; Dependencies: T060, T103; Acceptance: validation creates issues and moves documents to `needs_review` when reviewable records exist.
- [ ] T105 [P] Add validation tests in `tests/unit/ingestion/normalizers/*.test.ts` and `tests/unit/ingestion/validators/*.test.ts`; Dependencies: T093, T094, T095, T096, T097, T098, T099, T100, T101, T102, T103; Acceptance: tests cover price parsing, aliases, city/code mismatch, duplicates, promo/regular conflicts, expired validity, missing fees, and issue creation.

## Phase 12: Aliases

- [ ] T106 Create alias query helpers in `src/server/retrieval/aliases.ts`; Dependencies: T031; Acceptance: helpers create, update, delete, list, and resolve aliases with ambiguity flags.
- [ ] T107 Create built-in alias constants in `src/server/retrieval/built-in-aliases.ts`; Dependencies: T106; Acceptance: constants include common city/airport/airline aliases without tariff rows or prices.
- [ ] T108 Create alias initialization migration or idempotent setup in `drizzle/migrations/0004_builtin_aliases.sql` or `src/server/retrieval/alias-bootstrap.ts`; Dependencies: T106, T107; Acceptance: built-in aliases are non-tariff lookup data and do not create seed tariff data.
- [ ] T109 Create ambiguity handling service in `src/server/retrieval/ambiguity.ts`; Dependencies: T106; Acceptance: service returns clarification candidates for ambiguous city, airport, airline, promo, route, and date inputs.
- [ ] T110 Create alias API routes in `src/app/api/aliases/route.ts` and `src/app/api/aliases/[aliasId]/route.ts`; Dependencies: T045, T106; Acceptance: admin CRUD validates input, writes audit logs, and rejects duplicates.
- [ ] T111 Create alias admin UI in `src/app/admin/aliases/page.tsx` and `src/components/admin/alias-table.tsx`; Dependencies: T003, T110; Acceptance: admin can list, filter, create, edit, mark ambiguous, and delete aliases.
- [ ] T112 [P] Add alias tests in `tests/unit/retrieval/aliases.test.ts`, `ambiguity.test.ts`, and `tests/e2e/admin-aliases.spec.ts`; Dependencies: T106, T109, T110, T111; Acceptance: tests cover Jogja/YIA/JOG ambiguity, CRUD, and no seed tariff rows.

## Phase 13: Fact And Tariff Review UI

- [ ] T113 Create document list and detail queries in `src/server/db/queries/documents.ts`; Dependencies: T030, T031; Acceptance: queries return issue counts, ingestion status, review counts, and source metadata.
- [ ] T114 Create documents pages in `src/app/admin/documents/page.tsx` and `src/app/admin/documents/[documentId]/page.tsx`; Dependencies: T043, T113; Acceptance: admin sees document list, detail, ingestion status, and related records.
- [ ] T115 Create document table and detail components in `src/components/admin/document-table.tsx` and `document-detail.tsx`; Dependencies: T114; Acceptance: components render statuses, dates, storage flags, and error states.
- [ ] T116 Create chunk viewer pages in `src/app/admin/chunks/page.tsx` and `src/components/admin/chunk-table.tsx`; Dependencies: T078, T079, T113; Acceptance: admin can filter semantic and table chunks by document, status, page, and query.
- [ ] T117 Create extracted facts page and table in `src/app/admin/facts/page.tsx` and `src/components/admin/fact-review-table.tsx`; Dependencies: T031; Acceptance: admin can filter facts, view source snippet, edit fields, and change review status.
- [ ] T118 Create tariff row review page and table in `src/app/admin/review/page.tsx` and `src/components/admin/tariff-review-table.tsx`; Dependencies: T031; Acceptance: admin can inline edit, approve, reject, archive, reopen, and see issue badges.
- [ ] T119 Create fee rule review page and table in `src/app/admin/fee-rules/page.tsx` and `src/components/admin/fee-rule-table.tsx`; Dependencies: T031; Acceptance: admin can edit fees, min weight, PPN, surcharges, notes, and review status.
- [ ] T120 Create review API routes in `src/app/api/review/tariff-rows/route.ts`, `src/app/api/review/tariff-rows/[rowId]/route.ts`, `src/app/api/review/fee-rules/route.ts`, and `src/app/api/review/fee-rules/[ruleId]/route.ts`; Dependencies: T045, T031; Acceptance: routes enforce approve rules, active-only trust transitions, and audit logging.
- [ ] T121 Create fact review API route in `src/app/api/facts/[factId]/route.ts`; Dependencies: T045, T031; Acceptance: route supports save, approve, reject, archive, reopen, and audit logging.
- [ ] T122 Create bulk review action service in `src/server/ingestion/review/bulk-actions.ts`; Dependencies: T120, T121; Acceptance: bulk approve refuses records with blocking high severity issues.
- [ ] T123 Create source snippet preview component in `src/components/admin/source-snippet-preview.tsx`; Dependencies: T116, T117, T118, T119; Acceptance: preview shows raw row/snippet, page, document, and source metadata.
- [ ] T124 Create audit logging helper in `src/server/audit/audit-log.ts`; Dependencies: T031; Acceptance: all review actions write before/after audit records.
- [ ] T125 [P] Add review tests in `tests/integration/review/review-state.test.ts` and `tests/e2e/admin-review.spec.ts`; Dependencies: T117, T118, T119, T120, T121, T122, T124; Acceptance: tests cover edit, approve, reject, archive, bulk blocking, source preview, and active-only lookup.

## Phase 14: Embeddings

- [ ] T126 Create searchable text builder in `src/server/retrieval/embeddings.ts`; Dependencies: T078, T079, T089; Acceptance: builder creates source-rich text for document chunks, table chunks, extracted facts, and tariff rows.
- [ ] T127 Create OpenRouter embedding client in `src/server/retrieval/embeddings.ts`; Dependencies: T082, T083; Acceptance: client uses configured embedding model and returns setup-required when key is missing.
- [ ] T128 Create embedding persistence for document chunks in `src/server/retrieval/embedding-jobs.ts`; Dependencies: T022, T126, T127; Acceptance: document chunk embeddings upsert with owner type `document_chunk`.
- [ ] T129 Create embedding persistence for table chunks in `src/server/retrieval/embedding-jobs.ts`; Dependencies: T022, T126, T127; Acceptance: table chunk embeddings upsert with owner type `table_chunk`.
- [ ] T130 Create embedding persistence for extracted facts and tariff rows in `src/server/retrieval/embedding-jobs.ts`; Dependencies: T022, T126, T127; Acceptance: fact and tariff embeddings upsert with correct owner types.
- [ ] T131 Create embedding regeneration service in `src/server/retrieval/regenerate-embeddings.ts`; Dependencies: T128, T129, T130; Acceptance: admin or worker can regenerate embeddings by document and owner type.
- [ ] T132 Create vector search query helper in `src/server/retrieval/vector-search.ts`; Dependencies: T027, T127; Acceptance: helper returns owner type, owner id, score, and source metadata.
- [ ] T133 Add Supabase pgvector compatibility check in `src/server/deployment/health.ts`; Dependencies: T018, T027, T132; Acceptance: health check verifies vector extension and index usability on Supabase Postgres.
- [ ] T134 Wire embed-sources worker job in `src/server/ingestion/pipeline.ts`; Dependencies: T060, T128, T129, T130, T131; Acceptance: embedding job degrades cleanly without OpenRouter key.
- [ ] T135 [P] Add embedding tests in `tests/unit/retrieval/embeddings.test.ts` and `tests/integration/retrieval/vector-search.test.ts`; Dependencies: T126, T127, T128, T129, T130, T132; Acceptance: tests cover searchable text, missing key fallback, persistence owner types, and vector query shape.

## Phase 15: Retrieval

- [ ] T136 Create semantic chunk search in `src/server/retrieval/chunk-search.ts`; Dependencies: T132, T078; Acceptance: search returns chunk sources with snippets, page, document, and scores.
- [ ] T137 Create table chunk search in `src/server/retrieval/table-search.ts`; Dependencies: T132, T079; Acceptance: search returns row/header/table metadata and status filters.
- [ ] T138 Create fact search in `src/server/retrieval/fact-search.ts`; Dependencies: T031, T132; Acceptance: search filters by fact type, airline, destination, status, validity, and source.
- [ ] T139 Create structured tariff search in `src/server/retrieval/structured-search.ts`; Dependencies: T031, T106; Acceptance: search returns only active reviewed rows by default and supports route, promo, date, airline, origin, and destination filters.
- [ ] T140 Create Postgres full-text search helpers in `src/server/retrieval/full-text.ts`; Dependencies: T028; Acceptance: helpers query chunks, table chunks, facts, tariff rows, and fee rules with ranked results.
- [ ] T141 Create reciprocal rank fusion in `src/server/retrieval/rrf.ts`; Dependencies: T136, T140; Acceptance: RRF combines full-text and vector ranks deterministically with configurable weights.
- [ ] T142 Create hybrid search orchestration in `src/server/retrieval/hybrid-search.ts`; Dependencies: T136, T137, T138, T140, T141; Acceptance: hybrid search returns mixed ranked sources and component scores.
- [ ] T143 Create optional reranker interface in `src/server/retrieval/reranker.ts`; Dependencies: T142; Acceptance: disabled reranker is a no-op and enabled path is behind a provider abstraction.
- [ ] T144 Create source evidence lookup in `src/server/tariff/evidence.ts` and `src/server/retrieval/source-evidence.ts`; Dependencies: T031, T113; Acceptance: lookup returns document, page, snippet/raw row, effective date, validity, route, fee rules, and source type.
- [ ] T145 Create destination listing in `src/server/retrieval/destination-list.ts`; Dependencies: T139; Acceptance: lists active reviewed destinations with airline, route, promo, origin, validity, and source counts.
- [ ] T146 Create tariff comparison in `src/server/retrieval/compare-tariffs.ts`; Dependencies: T139, T144; Acceptance: comparison handles cheapest/latest/promo/regular and flags ambiguity when user intent is underspecified.
- [ ] T147 [P] Add retrieval tests in `tests/unit/retrieval/rrf.test.ts`, `hybrid-search.test.ts`, `structured-search.test.ts`, `source-evidence.test.ts`, `compare-tariffs.test.ts`, and `list-destinations.test.ts`; Dependencies: T136, T137, T138, T139, T141, T142, T144, T145, T146; Acceptance: tests cover active-only numeric lookup, hybrid RRF, source evidence, promo/regular ambiguity, and destination listing.

## Phase 16: Quote Calculation

- [ ] T148 Create tariff status and validation helpers in `src/server/tariff/status.ts` and `src/server/tariff/validation.ts`; Dependencies: T139; Acceptance: helpers classify active, expired, unreviewed, conflicting, and missing data states.
- [ ] T149 Create fee rule lookup in `src/server/tariff/fee-rules.ts`; Dependencies: T031, T144; Acceptance: lookup returns applicable active fee rules by airline, document, origin, destination, validity, and warnings.
- [ ] T150 Create deterministic quote calculator in `src/server/tariff/calculator.ts`; Dependencies: T148, T149; Acceptance: calculator computes billable weight, base SMU, admin fees, warehouse fees, surcharge, PPN, total, lines, source IDs, and warnings.
- [ ] T151 Create quote formatting helpers in `src/server/tariff/formatting.ts`; Dependencies: T150; Acceptance: formatting returns concise source-grounded quote lines for chat without doing math in the LLM.
- [ ] T152 Add quote tool contract implementation in `src/server/ai/tools/calculate-quote.ts`; Dependencies: T150, T151; Acceptance: tool requires active tariff row and returns NEEDS_CONFIRMATION for missing required fees.
- [ ] T153 [P] Add calculator tests in `tests/unit/tariff/calculator.test.ts`, `fee-rules.test.ts`, `validation.test.ts`, and `formatting.test.ts`; Dependencies: T148, T149, T150, T151; Acceptance: tests cover min weight, PPN, warehouse fee, admin fees, surcharges, missing fee warnings, expired rows, and source IDs.

## Phase 17: Chat Persistence

- [ ] T154 Create chat session service in `src/server/chat/sessions.ts`; Dependencies: T031; Acceptance: service creates, lists, searches, renames, soft deletes, and fetches sessions.
- [ ] T155 Create message persistence service in `src/server/chat/messages.ts`; Dependencies: T031; Acceptance: service persists user, assistant, system, and tool messages with AI SDK parts.
- [ ] T156 Create tool call persistence service in `src/server/chat/tool-calls.ts`; Dependencies: T031; Acceptance: service records pending, running, success, error states with input, output, error, and duration.
- [ ] T157 Create chat source persistence service in `src/server/chat/sources.ts`; Dependencies: T031, T144; Acceptance: service attaches source references and snippets to assistant messages.
- [ ] T158 Create answer verification persistence in `src/server/chat/verifications.ts`; Dependencies: T031; Acceptance: service stores mode, confidence state, checks, and warnings.
- [ ] T159 Create title generation service in `src/server/chat/title-generation.ts`; Dependencies: T082, T154; Acceptance: service generates short titles when model key exists and falls back to deterministic title when missing.
- [ ] T160 Create chat session API routes in `src/app/api/chat/sessions/route.ts`, `src/app/api/chat/sessions/[sessionId]/route.ts`, and `src/app/api/chat/sessions/[sessionId]/messages/route.ts`; Dependencies: T154, T155, T156, T157, T158; Acceptance: routes support list, create, rename, delete, and message history loading.
- [ ] T161 [P] Add chat persistence tests in `tests/integration/chat/sessions.test.ts`, `messages.test.ts`, `tool-calls.test.ts`, `sources.test.ts`, and `verifications.test.ts`; Dependencies: T154, T155, T156, T157, T158, T160; Acceptance: tests cover session CRUD, message history, tool calls, sources, verifications, and soft delete.

## Phase 18: Chat UI

- [ ] T162 Create AI chat shell in `src/components/ai/chat-shell.tsx`; Dependencies: T003, T004, T160; Acceptance: shell lays out sidebar, message area, composer, and responsive panes.
- [ ] T163 Create conversation sidebar in `src/components/ai/conversation-sidebar.tsx`; Dependencies: T154, T160, T162; Acceptance: sidebar lists, searches, creates, renames, deletes, and opens conversations.
- [ ] T164 Create chat pages in `src/app/chat/page.tsx` and `src/app/chat/[sessionId]/page.tsx`; Dependencies: T162, T163; Acceptance: pages load new or existing sessions using Server Components where appropriate.
- [ ] T165 Create message list and markdown rendering in `src/components/ai/message-list.tsx` and `src/components/ai/markdown-message.tsx`; Dependencies: T155, T162; Acceptance: messages render roles, markdown, citations, streaming placeholders, and errors.
- [ ] T166 Create prompt composer in `src/components/ai/prompt-composer.tsx`; Dependencies: T162; Acceptance: composer supports submit, stop, disabled setup-required state, keyboard submit, and accessible labels.
- [ ] T167 Create message actions in `src/components/ai/message-actions.tsx`; Dependencies: T165; Acceptance: copy and regenerate actions work with visible feedback.
- [ ] T168 Create streaming state integration in `src/components/ai/use-chat-stream.ts`; Dependencies: T160, T166; Acceptance: hook handles AI SDK-compatible streaming, stop generation, retry, regenerate, and errors.
- [ ] T169 Create confidence badge in `src/components/ai/confidence-badge.tsx`; Dependencies: T158, T165; Acceptance: badge renders CONFIDENT, NEEDS_CONFIRMATION, UNVERIFIED, and UNANSWERABLE states.
- [ ] T170 Create chain-of-thought and reasoning summary components in `src/components/ai/chain-of-thought.tsx` and `src/components/ai/reasoning.tsx`; Dependencies: T165; Acceptance: components show visible reasoning summaries and verification traces without exposing private chain-of-thought.
- [ ] T171 Create empty-state examples in `src/components/ai/empty-state-examples.tsx`; Dependencies: T162; Acceptance: examples include representative tariff, quote, source, and summary questions.
- [ ] T172 Create dark mode provider and toggle in `src/components/theme-provider.tsx` and `src/components/theme-toggle.tsx`; Dependencies: T003, T162; Acceptance: light/dark mode works without layout shifts.
- [ ] T173 [P] Add chat UI browser tests in `tests/e2e/chat-ui.spec.ts`; Dependencies: T162, T163, T164, T165, T166, T167, T168, T169, T170, T171, T172; Acceptance: tests cover responsive layout, new chat, search, rename, delete, copy, stop, regenerate, markdown, confidence badge, and dark mode.

## Phase 19: Tool-Call UI

- [ ] T174 Create tool call card component in `src/components/ai/tool-call-card.tsx`; Dependencies: T156, T165; Acceptance: card renders tool name, summary, pending/running/success/error state, and error message.
- [ ] T175 Create tool-call timeline in `src/components/ai/tool-call-timeline.tsx`; Dependencies: T156, T174; Acceptance: timeline orders tool calls by started_at and shows duration.
- [ ] T176 Create collapsed and expanded tool-call modes in `src/components/ai/tool-call-card.tsx`; Dependencies: T174; Acceptance: normal users see summaries and admins can expand debug JSON.
- [ ] T177 Create tool result serializers in `src/server/ai/stream-events.ts`; Dependencies: T156; Acceptance: serializers remove secrets, preserve source IDs, and expose safe summaries.
- [ ] T178 Integrate tool cards into message list in `src/components/ai/message-list.tsx`; Dependencies: T165, T174, T175, T176; Acceptance: tool calls appear inline or in timeline for streamed and persisted messages.
- [ ] T179 [P] Add tool-call UI tests in `tests/e2e/tool-calls.spec.ts` and `tests/unit/ai/stream-events.test.ts`; Dependencies: T174, T175, T176, T177, T178; Acceptance: tests cover states, duration, collapsed/expanded mode, safe serialization, and admin debug JSON.

## Phase 20: Source UI

- [ ] T180 Create source card component in `src/components/ai/source-card.tsx`; Dependencies: T157, T144; Acceptance: card shows source type, title, document, page, confidence, validity, and snippet.
- [ ] T181 Create source preview API route in `src/app/api/source/[sourceType]/[sourceId]/route.ts`; Dependencies: T045, T144; Acceptance: route returns source preview for every supported source type.
- [ ] T182 Create source detail panel in `src/components/ai/source-preview.tsx`; Dependencies: T180, T181; Acceptance: panel shows chunk, table chunk, fact, tariff row, fee rule, document, or page details.
- [ ] T183 Create source preview modal in `src/components/ai/source-preview-modal.tsx`; Dependencies: T182; Acceptance: modal is keyboard accessible and works on mobile and desktop.
- [ ] T184 Create fact, tariff row, and fee rule detail cards in `src/components/ai/fact-detail-card.tsx`, `tariff-row-detail-card.tsx`, and `fee-rule-detail-card.tsx`; Dependencies: T182; Acceptance: cards expose all high-stakes evidence fields from the spec.
- [ ] T185 Integrate source cards into message list in `src/components/ai/message-list.tsx`; Dependencies: T165, T180, T182, T183, T184; Acceptance: every persisted source can be inspected from an assistant answer.
- [ ] T186 [P] Add source UI tests in `tests/e2e/source-preview.spec.ts`; Dependencies: T180, T181, T182, T183, T184, T185; Acceptance: tests inspect chunk, table row, fact, tariff row, fee rule, document, and page previews.

## Phase 21: AI Chat Route

- [ ] T187 Create system prompt in `src/server/ai/system-prompt.ts`; Dependencies: T082; Acceptance: prompt encodes general RAG mode, verified numeric mode, no invented prices, source evidence, clarification, and concise answers.
- [ ] T188 Create tool schemas in `src/server/ai/tool-schemas.ts`; Dependencies: T007; Acceptance: schemas cover classifyIntent, retrieval, aliases, facts, tariffs, fee rules, quote, source evidence, destinations, comparison, verification, and ambiguity.
- [ ] T189 Create AI tool registry in `src/server/ai/tools.ts`; Dependencies: T106, T136, T137, T138, T139, T142, T144, T145, T146, T152, T188; Acceptance: registry exposes all assistant tools with safe serialized outputs.
- [ ] T190 Create intent classification implementation in `src/server/ai/tools/classify-intent.ts`; Dependencies: T187, T188; Acceptance: classifier distinguishes general RAG, verified numeric, quote, lookup, admin/status, clarification, and unanswerable.
- [ ] T191 Create answer verification implementation in `src/server/ai/tools/verify-answer.ts`; Dependencies: T148, T158, T188; Acceptance: verification returns CONFIDENT, NEEDS_CONFIRMATION, UNVERIFIED, or UNANSWERABLE with checks and warnings.
- [ ] T192 Create chat route orchestration in `src/server/ai/chat-route.ts`; Dependencies: T082, T083, T154, T155, T156, T157, T158, T177, T187, T189, T190, T191; Acceptance: orchestration streams AI SDK UI messages and persists messages, tools, sources, and verifications.
- [ ] T193 Create Next.js route handler in `src/app/api/chat/route.ts`; Dependencies: T192; Acceptance: route returns AI SDK useChat-compatible stream and sets max duration appropriate for streaming.
- [ ] T194 Implement general RAG mode branch in `src/server/ai/chat-route.ts`; Dependencies: T142, T187, T192; Acceptance: general document questions call retrieval tools, cite chunks, and return UNANSWERABLE when unsupported.
- [ ] T195 Implement verified numeric mode branch in `src/server/ai/chat-route.ts`; Dependencies: T139, T144, T148, T187, T192; Acceptance: price/route/schedule/validity answers always call tools and never trust raw chunks only.
- [ ] T196 Implement quote mode branch in `src/server/ai/chat-route.ts`; Dependencies: T150, T152, T195; Acceptance: total price questions always call `calculateQuote` and show line items and source evidence.
- [ ] T197 Implement missing API key response in `src/server/ai/chat-route.ts` and `src/components/ai/setup-required-message.tsx`; Dependencies: T082, T166, T192; Acceptance: app boots and chat shows setup-required state without crashing.
- [ ] T198 Implement error handling and safe stream failure states in `src/server/ai/chat-route.ts`; Dependencies: T192, T193; Acceptance: model, tool, DB, and retrieval errors persist a safe error message and do not expose secrets.
- [ ] T199 [P] Add AI chat route tests in `tests/integration/ai/chat-route.test.ts`, `tests/unit/ai/classify-intent.test.ts`, `verify-answer.test.ts`, and `tools.test.ts`; Dependencies: T188, T189, T190, T191, T192, T193, T194, T195, T196, T197, T198; Acceptance: tests cover general vs verified classification, active-fact-only lookup, quote tool requirement, missing key, source evidence, and ambiguity.

## Phase 22: Settings

- [ ] T200 Create settings schema and helpers in `src/server/db/queries/settings.ts` and `src/server/settings/schema.ts`; Dependencies: T031, T008; Acceptance: settings validate deployment, database, queue, model, retrieval, UI, storage, and quote defaults.
- [ ] T201 Create settings API route in `src/app/api/settings/route.ts`; Dependencies: T045, T200; Acceptance: GET redacts secrets and PATCH validates provider combinations and writes audit logs.
- [ ] T202 Create settings page in `src/app/admin/settings/page.tsx`; Dependencies: T043, T201; Acceptance: admin can view and update settings grouped by deployment, model, retrieval, UI, storage, and defaults.
- [ ] T203 Create deployment status panel in `src/components/admin/deployment-status-panel.tsx`; Dependencies: T018, T202; Acceptance: panel displays deployment mode, database provider, queue provider, vector status, upload root status, and OpenRouter key state.
- [ ] T204 Create model and retrieval settings form in `src/components/admin/model-retrieval-settings-form.tsx`; Dependencies: T200, T202; Acceptance: form edits chat model, embedding model, temperature, max steps, topK, hybrid weights, and reranker flag.
- [ ] T205 Create storage and UI settings form in `src/components/admin/storage-ui-settings-form.tsx`; Dependencies: T200, T202; Acceptance: form edits artifact flags, default origin, quote defaults, and tool-call visibility.
- [ ] T206 [P] Add settings tests in `tests/integration/settings/settings.test.ts` and `tests/e2e/admin-settings.spec.ts`; Dependencies: T200, T201, T202, T203, T204, T205; Acceptance: tests cover validation, redaction, provider status, storage flags, model settings, and missing key display.

## Phase 23: Tests

- [ ] T207 Create Vitest config and test setup in `vitest.config.mts` and `tests/setup.ts`; Dependencies: T010; Acceptance: `bun run test` executes unit tests with path aliases.
- [ ] T208 Create integration test database harness in `tests/integration/helpers/db.ts`; Dependencies: T015, T026; Acceptance: integration tests can run migrations and clean tables without seed tariff data.
- [ ] T209 Create parser fixture utilities in `tests/fixtures/documents/README.md` and `tests/helpers/document-fixtures.ts`; Dependencies: T073; Acceptance: fixtures are synthetic parser inputs, not seed tariff data for app runtime.
- [ ] T210 Create upload and review flow integration test in `tests/integration/flows/upload-review.test.ts`; Dependencies: T053, T080, T091, T104, T120, T121; Acceptance: test uploads a fixture, ingests, validates issues, reviews a row, and verifies active status.
- [ ] T211 Create retrieval and quote integration test in `tests/integration/flows/retrieval-quote.test.ts`; Dependencies: T147, T153; Acceptance: test verifies active reviewed rows power numeric lookup and deterministic quote totals.
- [ ] T212 Create chat tool integration test in `tests/integration/flows/chat-tools.test.ts`; Dependencies: T199; Acceptance: test verifies tool call persistence, source persistence, verified numeric refusal for unreviewed data, and missing key response.
- [ ] T213 Create deployment config integration test in `tests/integration/deployment/managed-fallback.test.ts`; Dependencies: T019, T032, T133; Acceptance: test covers Supabase URL selection, Upstash selection, DB fallback queue, and vector compatibility checks.
- [ ] T214 Create Playwright config and base fixtures in `playwright.config.ts` and `tests/e2e/helpers.ts`; Dependencies: T173; Acceptance: `bun run test:e2e` starts app and can authenticate as admin.
- [ ] T215 Create complete browser smoke flow in `tests/e2e/formalist-smoke.spec.ts`; Dependencies: T173, T186, T206, T214; Acceptance: smoke covers login, upload page, review page, settings page, chat page, source preview, responsive layout, and no eval dashboard route.
- [ ] T216 Create CI-style verification script in `scripts/verify.sh`; Dependencies: T207, T208, T214, T215; Acceptance: script runs typecheck, lint, unit tests, integration tests, and e2e smoke where services are available.

## Phase 24: Documentation

- [ ] T217 Create README with product overview and quickstart in `README.md`; Dependencies: T011, T012, T040; Acceptance: README explains Formalist, no seed data, no eval dashboard, and both deployment modes.
- [ ] T218 Document Docker setup in `docs/docker-local-vps.md`; Dependencies: T011, T025, T026, T027, T028, T063; Acceptance: guide covers app, worker, Postgres pgvector, Redis, migrations, uploads, backups, and health checks.
- [ ] T219 Document Supabase + Upstash fallback in `docs/managed-fallback.md`; Dependencies: T012, T032, T056, T133; Acceptance: guide covers Supabase vector extension, Drizzle migrations, Upstash limitations, DB fallback queue, and persistent local upload directory.
- [ ] T220 Document environment variables in `docs/environment.md`; Dependencies: T008, T009, T200; Acceptance: every env var is listed with allowed values, default behavior, and secret handling notes.
- [ ] T221 Document upload, chunking, extraction, and review flow in `docs/ingestion-review-flow.md`; Dependencies: T047, T080, T091, T104, T120, T121; Acceptance: guide explains statuses, review trust boundary, source evidence, and artifact flags.
- [ ] T222 Document chat usage and answer modes in `docs/chat-usage.md`; Dependencies: T187, T193, T194, T195, T196; Acceptance: guide explains general RAG, verified numeric mode, quote mode, confidence states, warnings, and citations.
- [ ] T223 Document architecture notes in `docs/architecture.md`; Dependencies: T217; Acceptance: document explains module boundaries, app/worker split, queue adapters, retrieval, verified numeric mode, and deterministic calculation.
- [ ] T224 Document local storage and backup notes in `docs/storage-backup.md`; Dependencies: T035, T036, T038, T039; Acceptance: guide explains `UPLOAD_ROOT`, optional artifacts, persistence limitations, backup scope, and public-root prohibition.
- [ ] T225 Document known limitations in `docs/limitations.md`; Dependencies: T217; Acceptance: document states scanned-only OCR limitations, local file persistence caveats, no object storage, no seed tariff data, no eval dashboard, and no third-party auth dependency.

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Foundation blocks all later phases.
- Phase 2 Deployment Adapters depends on Phase 1.
- Phase 3 Database And Migrations depends on Phase 1 and partially on Phase 2.
- Phase 4 Local Storage depends on env validation from Phase 1.
- Phase 5 Admin Auth depends on Foundation.
- Phase 6 Document Upload depends on Database, Storage, Admin Auth, and Queue factory.
- Phase 7 Ingestion Queue And Worker depends on Database and Deployment Adapters.
- Phase 8 Parsers depends on Worker pipeline types.
- Phase 9 Chunking depends on Parsers and Database persistence.
- Phase 10 LLM Extraction depends on AI provider setup, Chunking, and Worker.
- Phase 11 Normalization And Validation depends on Extraction.
- Phase 12 Aliases depends on Database and Retrieval alias helpers.
- Phase 13 Fact And Tariff Review UI depends on Database, Review queries, Admin Auth, Aliases, and Validation.
- Phase 14 Embeddings depends on AI provider, Chunking, Extraction, and pgvector migrations.
- Phase 15 Retrieval depends on Embeddings, Aliases, indexes, and reviewed data queries.
- Phase 16 Quote Calculation depends on Retrieval, fee rules, and tariff validation.
- Phase 17 Chat Persistence depends on Database and Source Evidence.
- Phase 18 Chat UI depends on Chat Persistence.
- Phase 19 Tool-Call UI depends on Chat Persistence and Chat UI.
- Phase 20 Source UI depends on Source Evidence and Chat UI.
- Phase 21 AI Chat Route depends on Retrieval, Quote Calculation, Chat Persistence, Tool UI serialization, and Source Evidence.
- Phase 22 Settings depends on Deployment Adapters, Health, Settings table, and Admin Auth.
- Phase 23 Tests depends on the implemented phases under test.
- Phase 24 Documentation depends on completed implementation decisions and quickstart behavior.

### User Story Mapping

- **US1 Ask Verified Tariff Questions**: T136-T153, T187-T199, T180-T186, T154-T161.
- **US2 Ask General Document Questions**: T136-T147, T187-T194, T180-T186.
- **US3 Upload And Ingest Documents**: T047-T105, T126-T135.
- **US4 Review And Activate Facts**: T106-T125, T148-T153.
- **US5 Operate Chat History And Evidence UX**: T154-T186.
- **US6 Configure Deployment, Models, Retrieval, And Storage**: T013-T019, T200-T206, T217-T224.
- **US7 Audit And Diagnose Extraction Quality**: T101-T105, T113-T125, T220-T225.

### Parallel Opportunities

- Foundation installation/config tasks T002-T007 can run in parallel after T001.
- Storage, auth, deployment health, and DB schema tasks can proceed in parallel after env and project setup.
- Parsers T066-T069 can run in parallel after parser types T065.
- Normalizers T093-T098 can run in parallel after extraction schemas exist.
- Retrieval modules T136-T140 can run in parallel after indexes and embeddings exist.
- UI components in Chat, Tool-Call, Source, Review, and Settings phases can be split by file once their server contracts are stable.
- Test tasks marked [P] can run in parallel with later UI tasks after their dependencies are complete.

## Implementation Strategy

### Complete First Version Strategy

1. Build Foundation through Database, Storage, Auth, and Queue adapters first.
2. Implement upload, parser, chunking, extraction, validation, review, aliases, and embeddings to create trustworthy document memory.
3. Implement retrieval and quote calculation before the AI route so tools have deterministic behavior.
4. Implement chat persistence, chat UI, tool-call UI, and source UI.
5. Implement AI chat route modes and verification.
6. Finish settings, tests, and documentation.

### Independent Verification Gates

- Upload gate: T053 proves supported files create documents and jobs.
- Ingestion gate: T080, T091, and T104 prove documents become chunks, facts, rows, rules, and issues.
- Review gate: T125 proves only reviewed active records become trusted.
- Retrieval gate: T147 proves hybrid search, source evidence, and active-only lookup.
- Quote gate: T153 proves deterministic quote math.
- Chat gate: T199 proves general RAG, verified numeric, quote, ambiguity, source evidence, and missing key behavior.
- UI gate: T173, T179, T186, T206, and T215 prove the usable first-version product.
- Deployment gate: T032, T133, T213, T218, and T219 prove local/VPS and managed fallback modes.

## Notes

- Do not create runtime seed tariff rows, demo tariff data, or an eval/test-question dashboard.
- Test fixtures are allowed only inside `tests/fixtures/` and must not be loaded by application startup.
- Every high-stakes numeric path must preserve reviewed active status checks and source evidence.
- Every admin mutation must write audit logs.
