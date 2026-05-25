# Feature Specification: Formalist Agentic RAG Assistant

**Feature Branch**: `001-agentic-rag-assistant`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "Build Formalist, a complete ChatGPT-style agentic RAG assistant for air cargo tariff and pricelist documents."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ask Verified Tariff Questions (Priority: P1)

A chat user asks natural-language questions about air cargo prices, routes,
schedules, validity, fees, destination availability, promo versus regular rates,
or quote totals. The assistant decides whether the question requires verified
numeric mode, resolves aliases, retrieves trusted reviewed data, calls tools,
cross-checks evidence, calculates totals when needed, streams the answer, and
shows confidence plus source evidence.

**Why this priority**: This is the primary product promise. The assistant must
provide trusted tariff answers instead of a generic chatbot response.

**Independent Test**: With at least one reviewed active tariff row and related
fee rules available, ask representative questions such as "Harga Pelita ke
Surabaya berapa?", "Kalau 20 kg ke Surabaya pakai Pelita total berapa?", and
"Tujuan UPG paling murah maskapai apa?". Verify streamed answers use reviewed
facts, show tool calls, cite sources, and avoid untrusted raw chunks as final
numeric truth.

**Acceptance Scenarios**:

1. **Given** a reviewed active Pelita tariff row for Surabaya and active fee
   rules, **When** a user asks for the Pelita Surabaya price, **Then** the
   assistant returns the price with CONFIDENT status and source evidence.
2. **Given** reviewed active tariff and fee rules for a destination, **When** a
   user asks for a 20 kg quote, **Then** the assistant calculates billable
   weight, base cost, applicable fees, tax, surcharge, and total while showing
   the facts used.
3. **Given** only unreviewed extracted rows for a numeric question, **When** the
   user asks for a trusted price, **Then** the assistant does not present those
   rows as final truth and instead marks the answer UNVERIFIED or asks for admin
   review.
4. **Given** an ambiguous alias such as "Jogja", **When** multiple destinations
   could match, **Then** the assistant asks for clarification or presents
   alternatives before answering.

---

### User Story 2 - Ask General Document Questions (Priority: P1)

A chat user asks for document summaries, definitions, source lookup, fee note
explanations, active document lists, or non-numeric document Q&A. The assistant
uses general RAG mode, retrieves relevant chunks, streams a grounded answer, and
cites source chunks without inventing unsupported claims.

**Why this priority**: Users need conversational access to document knowledge
outside exact numeric quote workflows.

**Independent Test**: Upload an air cargo pricelist document, complete
ingestion, and ask "Ringkas isi dokumen ini", "Apa aturan PPN di dokumen?", and
"Dokumen mana yang aktif untuk Pelita?". Verify answers cite source chunks or
document references and do not claim unsupported details.

**Acceptance Scenarios**:

1. **Given** ingested document chunks, **When** the user asks for a summary,
   **Then** the assistant answers from retrieved chunks with inline citations.
2. **Given** a user asks to show where a price came from, **When** source
   evidence exists, **Then** the assistant opens or displays the document,
   page, chunk, table row, or fact reference.
3. **Given** no relevant chunks are found, **When** a user asks a document
   question, **Then** the assistant returns UNANSWERABLE with a useful next
   step instead of guessing.
4. **Given** many ingested documents, **When** the assistant searches chunks or
   table chunks, **Then** retrieval executes in Postgres using full-text
   ranking, pgvector similarity, and metadata filters rather than fetching all
   rows into Node.js memory.
5. **Given** archived or superseded documents, **When** the user asks a normal
   general RAG question, **Then** archived chunks are excluded unless the query
   explicitly requests archived/history data.
6. **Given** a draft answer and retrieved evidence, **When** the answer cannot
   be grounded in retrieved snippets, **Then** verification marks the answer
   UNVERIFIED or UNANSWERABLE instead of presenting unsupported claims.

---

### User Story 3 - Upload And Ingest Documents (Priority: P1)

An admin uploads PDF, DOCX, or TXT air cargo tariff documents, chooses artifact
storage settings, monitors ingestion progress, and receives extracted text,
page text, semantic chunks, table-aware chunks, structured facts, tariff rows,
fee rules, metadata, source evidence, and extraction issues for review.

**Why this priority**: The chatbot cannot answer with evidence until documents
are transformed into reliable memories and reviewable facts.

**Independent Test**: Upload one PDF, one DOCX, and one TXT document containing
tables, fees, validity dates, and route data. Verify document records, text,
chunks, table chunks, facts, rows, fee rules, source metadata, and issues are
created, and optional artifacts follow the chosen storage settings.

**Acceptance Scenarios**:

1. **Given** original file storage is enabled, **When** an admin uploads a
   supported file, **Then** the file is stored outside the public web root and
   linked to a document record.
2. **Given** original file storage is disabled, **When** an admin uploads a
   supported file, **Then** text, chunks, facts, and source metadata are stored
   while the original file is not retained.
3. **Given** a table contains suspicious or missing values, **When** ingestion
   finishes, **Then** the admin sees extraction issues tied to the affected row
   or source evidence.

---

### User Story 4 - Review And Activate Facts (Priority: P1)

An admin reviews extracted chunks, table chunks, facts, tariff rows, and fee
rules; edits incorrect fields; resolves issues; manages aliases; approves,
rejects, or archives records; and views audit history before data can be used
for trusted numeric answers.

**Why this priority**: Human review is the trust boundary for high-stakes
numeric information.

**Independent Test**: Ingest a document that produces extracted rows and issues.
Review a tariff row, edit a destination alias, approve the row, reject another
row, and verify only active reviewed records are available for trusted numeric
answers.

**Acceptance Scenarios**:

1. **Given** a newly extracted tariff row, **When** ingestion completes, **Then**
   the row is marked extracted or needs_review and is not used as trusted truth.
2. **Given** an admin approves an edited row, **When** a chat user asks a
   matching numeric question, **Then** the assistant may use that row as active
   evidence.
3. **Given** an admin rejects or archives a fact, **When** the assistant
   searches trusted facts, **Then** the rejected or archived record is excluded.
4. **Given** aliases exist for a destination or airline, **When** an admin
   updates them, **Then** future chat lookups use the reviewed alias mapping.

---

### User Story 5 - Operate Chat History And Evidence UX (Priority: P2)

A chat user manages conversations with a sidebar, creates new chats, searches,
renames, deletes, copies messages, regenerates answers, stops generation, sees
visible tool-call cards, visible reasoning summaries, a tool timeline, markdown
rendering, confidence states, source cards, and a source preview panel in light
or dark mode.

**Why this priority**: The main product must feel like a complete assistant
rather than a one-off query form.

**Independent Test**: Use the chat interface across desktop and mobile widths,
create multiple conversations, stream and stop an answer, regenerate a message,
inspect tool calls and sources, switch theme, and verify history persists.

**Acceptance Scenarios**:

1. **Given** previous conversations exist, **When** the user opens the app,
   **Then** the sidebar lists persistent chats and supports search.
2. **Given** an assistant answer contains source evidence, **When** the user
   selects a source card, **Then** a preview shows the referenced chunk, row,
   fact, document, and page when available.
3. **Given** a response is streaming, **When** the user presses stop, **Then**
   generation stops gracefully and the partial message remains understandable.

---

### User Story 6 - Configure Deployment, Models, Retrieval, And Storage (Priority: P2)

An admin configures deployment mode, data providers, queue provider, active chat
and embedding models, response temperature, maximum tool steps, retrieval topK,
hybrid search weights, reranker setting, default origin, quote calculation
defaults, tool-call visibility, original file storage, page image storage, and
debug artifact storage.

**Why this priority**: Formalist must run in both self-hosted and managed
fallback environments without hard-coded infrastructure assumptions.

**Independent Test**: Change settings in the admin dashboard, restart the
application where required, and verify chat, ingestion, queueing, storage, and
retrieval honor the selected configuration.

**Acceptance Scenarios**:

1. **Given** docker-local mode is selected, **When** the app starts, **Then** it
   uses local providers and local filesystem artifacts.
2. **Given** managed-fallback mode is selected, **When** environment variables
   are provided, **Then** the app uses managed database and queue providers
   while still requiring no object storage.
3. **Given** no chat model key is configured, **When** the app boots, **Then**
   non-LLM admin workflows remain available and chat/extraction show setup
   required states.

---

### User Story 7 - Audit And Diagnose Extraction Quality (Priority: P3)

An admin views extraction issues, audit logs, suspicious rows, conflicts,
expired data, missing validity, low confidence extraction, table row/source
mismatch, and review actions so document memory quality can be maintained over
time.

**Why this priority**: Operators need a way to find and fix the data quality
problems that block trusted answers.

**Independent Test**: Ingest a document with N/A rows, missing fees, ambiguous
aliases, duplicate routes, and expired validity. Verify issues are grouped,
filterable, linked to source evidence, and resolved through review actions.

**Acceptance Scenarios**:

1. **Given** ingestion flags a city/code mismatch, **When** an admin opens the
   issues page, **Then** the issue links to the row, fact, and source snippet.
2. **Given** a reviewed fact is edited, **When** the audit log is opened, **Then**
   it shows what changed, when it changed, and the related source evidence.
3. **Given** conflicting promo and regular rows exist, **When** the admin
   filters extraction issues, **Then** the conflict is visible and reviewable.

### Edge Cases

- Uploaded files are unsupported, corrupt, password-protected, empty, too large,
  duplicate, or contain scanned pages with no extractable text.
- A document lacks effective dates, validity periods, fee rules, airport codes,
  airline names, or destination names.
- A table includes N/A prices, merged cells, repeated headers, multi-line rows,
  currency formatting variations, decimal separators, or notes that apply to
  multiple rows.
- A destination alias maps to multiple cities or airport codes.
- Multiple active reviewed facts conflict for the same airline, destination,
  route, validity period, or promo status.
- A reviewed fact is expired, superseded, archived, rejected, or outside the
  requested validity date.
- A user asks for a numeric answer before any reviewed facts exist.
- A user asks a quote without weight, origin, airline, or destination when those
  values cannot be inferred safely.
- A quote uses weight below minimum weight or requires surcharge, warehouse,
  admin, or tax rules that are missing or ambiguous.
- The application boots without a model key.
- File artifact storage is disabled or the local artifact path is unavailable.
- A chat stream is stopped, retried, regenerated, or fails mid-response.
- The managed fallback providers are configured but unavailable.
- Admin routes are accessed by an unauthenticated or unauthorized user.

### Constitution Requirements

- **Agentic RAG Scope**: The assistant is the main product. It must classify
  intent, plan work, retrieve evidence, call tools, verify facts, calculate
  quotes through deterministic services, stream answers, and cite sources.
- **Document Memories**: Ingestion must produce semantic chunks, table-aware
  chunks, structured facts, tariff rows, fee rules, source references, optional
  original files/page artifacts, and chat/tool-call history.
- **Verified Numeric Mode**: Prices, fees, totals, validity dates, schedules,
  routes, destination availability, promo comparisons, and quotes must use
  reviewed active facts or reviewed active table rows linked to sources.
- **Human Review**: Extracted facts, tariff rows, and fee rules start as
  extracted or needs_review. Admin approval is required before active trusted
  use, and edits/rejections/archives must be auditable.
- **Deterministic Calculation**: Quote totals, billable weight, base SMU cost,
  fees, surcharges, PPN, and total must be calculated deterministically outside
  the language model. The assistant may explain but not invent the math.
- **Source Traceability**: Price, fee, route, schedule, quote, and availability
  answers must show airline, destination, route, flight, price, schedule, promo
  status, effective date, validity, fee details, document, page, source
  reference, and raw snippet or row text when available.
- **Deployment/Storage**: The product must support local/VPS and managed
  fallback operation, with environment-selected providers and optional local
  filesystem artifacts. Managed object storage is not required.
- **Security/Degradation**: Admin routes must be protected, secrets must come
  from environment variables, artifacts must not be public, and the app must
  boot without a model key while showing setup-required states for LLM features.
- **Excluded Scope**: The feature excludes seed tariff data, an eval or
  test-question dashboard, multi-tenant SaaS billing, third-party auth provider
  dependency, and a generic unsupported free-form chatbot.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a ChatGPT-style conversational interface
  as the primary product surface.
- **FR-002**: Users MUST be able to create, search, rename, delete, and revisit
  persistent chat conversations.
- **FR-003**: The chat interface MUST stream assistant messages and provide
  submit, stop, retry, and regenerate controls.
- **FR-004**: Users MUST be able to copy messages and view markdown-rendered
  responses.
- **FR-005**: The chat interface MUST display visible tool-call cards, a
  tool-call timeline, visible reasoning summaries, confidence states, inline
  citations, source cards, and source previews.
- **FR-006**: The assistant MUST classify each user question as general RAG,
  verified numeric, quote calculation, admin/status lookup, clarification, or
  unanswerable before producing a final answer.
- **FR-007**: The assistant MUST answer general document questions from
  retrieved chunks with citations and must not invent unsupported claims.
- **FR-008**: The assistant MUST answer high-stakes numeric questions only from
  reviewed active facts, reviewed active table rows, or deterministic
  calculations based on reviewed active records.
- **FR-009**: The assistant MUST clearly mark answers as CONFIDENT,
  NEEDS_CONFIRMATION, UNVERIFIED, or UNANSWERABLE.
- **FR-010**: The assistant MUST ask for clarification or present alternatives
  when destination, airline, origin, route, validity, or quote inputs are
  ambiguous.
- **FR-011**: The assistant MUST warn when relevant data is unreviewed,
  conflicting, expired, suspicious, missing, or outside validity.
- **FR-012**: The system MUST support tools for retrieval, alias resolution,
  structured fact search, tariff/fact detail lookup, fee rule lookup, quote
  calculation, source evidence lookup, document lookup, destination listing,
  ambiguity detection, and verification.
- **FR-013**: Admin users MUST be able to upload PDF, DOCX, and TXT documents.
- **FR-014**: Admin users MUST be able to choose whether original files, page
  images, and debug artifacts are stored.
- **FR-015**: The system MUST create document records with source metadata for
  uploaded files.
- **FR-016**: The system MUST process uploaded documents asynchronously and show
  ingestion progress.
- **FR-017**: The system MUST extract document text, page text when available,
  table-like structures, document metadata, semantic chunks, table-aware chunks,
  structured facts, tariff rows, fee rules, and source evidence.
- **FR-018**: Chunks and table chunks MUST include metadata such as document,
  page, section title, table id, row number, nearby headers, and source
  references when available.
- **FR-019**: The system MUST support semantic chunk search, table-aware chunk
  search, structured fact search, exact tariff/fact lookup, alias lookup, hybrid
  search, and an optional reranking step.
- **FR-019A**: Chunk and table-chunk search MUST NOT load all rows and filter
  with JavaScript substring checks. Filtering, full-text ranking, metadata
  filtering, and vector similarity MUST execute in Postgres.
- **FR-019B**: General RAG retrieval MUST use stored Qwen embeddings through
  pgvector when embeddings exist. If embedding generation is unavailable,
  retrieval MUST fall back to ranked Postgres full-text or ILIKE lookup, not
  in-memory scans.
- **FR-019C**: Full-text retrieval MUST use `ts_rank` or `ts_rank_cd` scores
  rather than a constant score so reciprocal-rank fusion receives meaningful
  component rankings.
- **FR-019D**: Hybrid retrieval MUST support metadata freshness filters,
  including document status, owner type, document ID, and explicit opt-in for
  archived/superseded documents.
- **FR-019E**: Intent classification SHOULD use a lightweight structured LLM
  classification step when a model provider is configured. The fallback
  classifier MUST be conservative and MUST NOT route broad words such as
  "review" away from general RAG without admin/tariff context.
- **FR-019F**: The chat route SHOULD check a short-lived Redis response cache
  before spending LLM tokens, while preserving source evidence and verified
  numeric trust constraints.
- **FR-020**: The system MUST extract tariff prices, destination availability,
  route type, transit route, flight number, schedule, validity rules, promo
  rules, fee rules, minimum weight, PPN rules, surcharge rules, N/A prices, and
  document-level metadata when present.
- **FR-021**: The system MUST validate extracted records and flag missing price,
  N/A price, invalid price format, missing airline, missing destination, missing
  airport code, suspicious city/code mismatch, ambiguous aliases, duplicate
  rows, conflicting promo/regular facts, expired validity, missing validity,
  missing fee rules, low confidence extraction, and table row/source mismatch.
- **FR-022**: Extracted facts, tariff rows, and fee rules MUST start as
  extracted or needs_review.
- **FR-023**: Admin users MUST be able to review, edit, approve, reject, and
  archive extracted facts, tariff rows, and fee rules.
- **FR-024**: Only reviewed active facts, tariff rows, and fee rules MUST be
  eligible for trusted numeric answers.
- **FR-025**: Admin users MUST be able to manage aliases for cities, airport
  codes, airline names, and common user spellings.
- **FR-026**: Admin users MUST be able to view extraction issues and navigate
  from an issue to the related document, source chunk, table chunk, fact, row,
  or fee rule.
- **FR-027**: Admin users MUST be able to view audit logs for upload, ingestion,
  extraction, review, edit, approval, rejection, archive, alias, and settings
  actions.
- **FR-028**: The system MUST calculate quotes using reviewed active tariff and
  fee data, including billable weight, base SMU cost, airline admin fee,
  warehouse fee, warehouse admin fee, surcharge when applicable, PPN, and total.
- **FR-029**: Quote answers MUST show the calculation inputs, intermediate
  values, total, confidence, and source evidence.
- **FR-030**: Every price, fee, route, schedule, availability, and quote answer
  MUST include source evidence with document name, page when available, source
  reference, raw row or snippet, effective date, validity period, and relevant
  fee rules.
- **FR-031**: Admin users MUST have pages for documents, ingestion status,
  chunks and table chunks, extracted facts, tariff row review, fee rule review,
  aliases, extraction issues, audit logs, and settings.
- **FR-032**: Admin users MUST be able to configure deployment mode, database
  provider, queue provider, active chat model, active embedding model,
  temperature, max tool steps, retrieval topK, hybrid search weights, reranker
  flag, default origin, quote defaults, tool-call visibility, and artifact
  storage settings.
- **FR-033**: The application MUST support both local/VPS deployment and managed
  fallback deployment through environment-based configuration.
- **FR-034**: The application MUST use local filesystem storage for optional
  original files and artifacts and MUST NOT require managed object storage.
- **FR-035**: Admin routes MUST be protected from unauthorized access.
- **FR-036**: Uploaded files and generated artifacts MUST NOT be stored under a
  public web root.
- **FR-037**: Secrets and API keys MUST be supplied through environment
  configuration and MUST NOT be committed.
- **FR-038**: The application MUST boot without a model key and keep non-LLM
  admin pages, stored documents, stored chunks, manual review, deterministic
  lookup, and deterministic calculation usable.
- **FR-039**: LLM extraction and chat MUST show setup-required states when the
  required model key is unavailable.
- **FR-040**: The product MUST provide clear deployment documentation for both
  local/VPS and managed fallback modes.
- **FR-041**: The product MUST NOT require seed tariff data.
- **FR-042**: The product MUST NOT include an eval or test-question dashboard.
- **FR-043**: The first version MUST satisfy the user-provided platform
  constraints: Next.js 16 App Router, shadcn/ui, AI Elements, AI SDK streaming,
  OpenRouter, separate app and worker processes, local Postgres with pgvector,
  local Redis, Supabase Postgres fallback, Upstash Redis fallback, and Docker
  Compose for local/VPS operation.
- **FR-044**: The implementation MUST prefer modern, maintained, focused
  packages for reusable document parsing, text splitting, tool-state, caching,
  and similar infrastructure primitives when those packages preserve Formalist's
  verification and provenance requirements. Custom implementations are allowed
  only when the domain contract requires deterministic behavior, source
  traceability, or reviewed-fact enforcement that a package cannot safely
  provide.
- **FR-045**: PDF parsing MUST use `@opendataloader/pdf`, DOCX parsing MUST use
  `officeparser`, and semantic document chunking MUST use
  `@langchain/textsplitters` as the base splitter with `sentence-splitter` for
  sentence-boundary preservation and `gpt-tokenizer` for token-aware sizing.
  Formalist metadata and review rules are layered on top.
- **FR-046**: When implementing AI tool orchestration features, the project MUST
  evaluate `ai-sdk-tools` or equivalent AI SDK-native utilities for tool state,
  cache, and reusable tool abstractions before adding custom state/cache code.
- **FR-047**: Deterministic quote and currency calculations MUST use
  `decimal.js` for decimal-safe arithmetic and explicit rounding. Floating
  point JavaScript `number` arithmetic MUST NOT be the source of trusted money
  totals.
- **FR-048**: Alias resolution and fuzzy matching SHOULD use `fuse.js` for
  ranked fuzzy search and `fastest-levenshtein` for deterministic edit-distance
  tie-breaks or ambiguity checks.
- **FR-049**: Local search indexes SHOULD evaluate `flexsearch` and
  `minisearch` before adding custom in-memory keyword indexes. Postgres
  full-text search remains the durable source for server retrieval, but local
  indexes may be used for admin UI filtering, offline helpers, or small
  candidate sets.
- **FR-050**: Optional local reranking SHOULD be implemented behind an
  abstraction using `@huggingface/transformers` when feasible. Candidate models
  MUST be benchmarked for latency and quality before becoming defaults; current
  candidates include small Ettin rerankers for fast CPU/local use and
  BGE/Jina/mxbai rerankers when multilingual or higher-quality reranking is
  required.
- **FR-051**: Extraction and validation support code SHOULD evaluate
  `jsonrepair` for repairing model JSON only before schema validation,
  `json-rules-engine` for configurable validation rules, and `xstate` for
  complex workflow/state machines if ingestion or review transitions outgrow
  simple explicit TypeScript state handlers.

### Key Entities _(include if feature involves data)_

- **User**: A person using Formalist as either a chat user or admin/operator.
- **Conversation**: A persistent chat thread containing messages, tool calls,
  source references, confidence states, and user actions.
- **Message**: A user, assistant, tool, or system-visible entry within a
  conversation.
- **Tool Call**: A visible assistant action such as retrieval, lookup,
  verification, calculation, or source evidence lookup.
- **Document**: An uploaded PDF, DOCX, or TXT tariff/pricelist source with
  metadata, status, optional stored file, and optional page artifacts.
- **Document Page**: Page-level extracted text and source location metadata when
  the source format supports pages.
- **Chunk**: A semantic text segment used for general document retrieval.
- **Table Chunk**: A table-aware segment representing a row, group of rows, or
  table section with headers and source metadata.
- **Structured Fact**: A machine-extracted or reviewed factual statement such
  as a validity rule, fee note, schedule, or route fact.
- **Tariff Row**: A structured record for airline, origin, destination, airport
  code, route, flight, price, schedule, promo status, validity, and source row.
- **Fee Rule**: A structured fee, surcharge, PPN, warehouse, admin, inclusion,
  exclusion, or minimum weight rule.
- **Alias**: A reviewed mapping between user wording and canonical city,
  airport, airline, or destination identifiers.
- **Extraction Issue**: A flagged problem requiring review, such as missing
  price, ambiguous alias, invalid format, conflict, or source mismatch.
- **Review Decision**: An admin action that approves, edits, rejects, archives,
  or reopens an extracted fact, tariff row, or fee rule.
- **Source Evidence**: A linkable reference to document, page, chunk, table
  chunk, fact, tariff row, fee rule, snippet, or raw row text.
- **Quote**: A deterministic calculation record with inputs, reviewed source
  facts, intermediate values, total, confidence, and source evidence.
- **Settings**: Admin-configurable deployment, model, retrieval, quote,
  visibility, and storage preferences.
- **Audit Log**: A chronological record of security-relevant and review-relevant
  actions.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A first-time admin can upload a supported tariff document and see
  ingestion progress within 2 minutes.
- **SC-002**: At least 95% of completed ingestions create document text,
  semantic chunks, table-aware chunks, source metadata, and reviewable extracted
  records for documents with extractable text.
- **SC-003**: Chat users receive the first streamed response content within 5
  seconds for at least 90% of ordinary document questions in a healthy
  deployment.
- **SC-004**: 100% of trusted numeric answers are backed by reviewed active
  facts, reviewed active table rows, or deterministic calculations based on
  reviewed active records.
- **SC-005**: 100% of price, fee, route, schedule, availability, and quote
  answers include source evidence sufficient for a user to inspect the source.
- **SC-006**: 100% of unreviewed, rejected, archived, or expired records are
  excluded from trusted numeric answers unless explicitly presented as
  unverified context.
- **SC-007**: Admins can review, edit, approve, reject, or archive a single
  extracted row in under 90 seconds after opening the review page.
- **SC-008**: Users can complete common chat actions--new chat, search, rename,
  delete, stop, retry, regenerate, copy, inspect tool calls, inspect sources--on
  desktop and mobile layouts.
- **SC-009**: The application starts without a model key and keeps non-LLM admin
  and deterministic workflows available in 100% of startup tests.
- **SC-010**: The same feature set can be configured for both local/VPS and
  managed fallback environments without changing product behavior visible to
  users.
- **SC-011**: No seed tariff data is required to start, configure, upload, or
  review real documents.
- **SC-012**: No eval or test-question dashboard is present in the first version.

## Assumptions

- Formalist is a single-organization product in the first version; multi-tenant
  SaaS billing is out of scope.
- Admin authentication is required, but dependency on a third-party auth
  provider is out of scope.
- Chat users and admins may be separate roles, but the first version may run in
  a simple deployment with a small operator-managed user set.
- The default operating language for user questions may include Indonesian and
  English terms common in Indonesian air cargo workflows.
- "Visible reasoning" means user-facing reasoning summaries and verification
  traces, not disclosure of private chain-of-thought text.
- Documents are expected to contain extractable text in the first version; OCR
  for scanned-only PDFs may be treated as unsupported or future enhancement
  unless explicitly added during planning.
- Page numbers are shown when available from the source format; TXT sources may
  use line, section, or chunk references instead.
- Artifact storage settings apply prospectively to new ingestions; existing
  artifacts follow their original storage decision unless separately migrated.
- The first version focuses on air cargo tariff/pricelist documents and should
  not present itself as a generic unsupported free-form chatbot.
