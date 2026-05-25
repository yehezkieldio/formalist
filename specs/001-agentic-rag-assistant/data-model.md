# Data Model: Formalist Agentic RAG Assistant

## Status Enums

- `document_status`: `uploaded`, `parsing`, `chunked`, `extracted`,
  `needs_review`, `active`, `archived`, `rejected`, `failed`
- `review_status`: `extracted`, `needs_review`, `active`, `rejected`, `archived`
- `chunk_status`: `active`, `archived`
- `route_type`: `DIRECT`, `TRANSIT`, `ANY`, `UNKNOWN`
- `price_status`: `NUMERIC`, `NA`, `MISSING`
- `issue_severity`: `low`, `medium`, `high`
- `issue_status`: `open`, `resolved`, `ignored`
- `job_status`: `queued`, `running`, `completed`, `failed`
- `tool_call_state`: `pending`, `running`, `success`, `error`
- `confidence_state`: `CONFIDENT`, `NEEDS_CONFIRMATION`, `UNVERIFIED`,
  `UNANSWERABLE`
- `answer_mode`: `general_rag`, `verified_numeric`

## Core Entities

### documents

Uploaded tariff/pricelist source record.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| filename | text | required |
| file_type | text | required; `pdf`, `docx`, `txt` |
| mime_type | text | required |
| original_path | text nullable | outside public web root; only when original storage enabled |
| checksum | text nullable | used for duplicate detection |
| source_name | text nullable | display/source label |
| document_kind | text nullable | pricelist, fee sheet, schedule, note, unknown |
| origin_city | text nullable | normalized when known |
| origin_airport | text nullable | normalized airport code when known |
| commodity | text nullable | optional document commodity scope |
| effective_date | date nullable | extracted/reviewed document date |
| valid_from | date nullable | inclusive validity start |
| valid_until | date nullable | inclusive validity end |
| is_promo | boolean | default false |
| status | document_status | lifecycle state |
| ingestion_error | text nullable | set on failed ingestion |
| store_original_file | boolean | persisted upload choice |
| store_page_images | boolean | persisted upload choice |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Relationships: one document has many pages, chunks, table chunks, facts, tariff
rows, fee rules, extraction issues, ingestion jobs, and audit logs.

### document_pages

Page-level extracted text and optional page artifact.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| page_number | integer | 1-based when available |
| raw_text | text nullable | extracted page text |
| page_image_path | text nullable | outside public web root |
| created_at | timestamp | required |

Validation: `(document_id, page_number)` is unique when page number exists.

### document_chunks

Semantic chunks for general RAG.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| page_number | integer nullable | source page when available |
| chunk_index | integer | document-local ordering |
| chunk_type | text | `narrative`, `note`, `heading`, `mixed`, `unknown` |
| content | text | required |
| metadata | jsonb nullable | section, nearby headings, parser metadata |
| status | chunk_status | active or archived |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Indexes: document/page lookup, GIN full-text search over `content`, and optional
metadata indexes for section/table references.

### table_chunks

Table-aware row or table-section evidence.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| page_number | integer nullable | source page when available |
| table_index | integer nullable | document/page-local table ordering |
| row_index | integer nullable | table-local row ordering |
| header_text | text nullable | nearest header row(s) |
| row_text | text | required raw row text |
| markdown | text nullable | table/row markdown representation |
| metadata | jsonb nullable | column map, notes, parser confidence |
| status | review_status | extracted/review/active/rejected/archived |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Validation: table rows with missing or suspicious fields create extraction
issues. Active table chunks may support verified numeric answers only after
review.

### extracted_facts

Reviewable structured fact from chunks or table chunks.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| source_chunk_id | uuid nullable | references document_chunks |
| source_table_chunk_id | uuid nullable | references table_chunks |
| fact_type | text | tariff_price, fee_rule, validity_rule, schedule, route, destination, document_metadata, surcharge, minimum_weight, ppn, other |
| subject | text nullable | fact subject |
| predicate | text nullable | relation/field |
| value_text | text nullable | text value |
| value_number | numeric nullable | numeric value |
| unit | text nullable | kg, percent, currency, etc. |
| currency | text nullable | IDR or extracted currency |
| airline | text nullable | normalized when possible |
| destination_city | text nullable | normalized when possible |
| destination_code | text nullable | airport code |
| origin_city | text nullable | normalized when possible |
| origin_airport | text nullable | airport code |
| route_type | text nullable | direct/transit/unknown |
| transit_route | text nullable | route path |
| flight_number | text nullable | flight identifier |
| schedule | text nullable | raw schedule |
| effective_date | date nullable | source effective date |
| valid_from | date nullable | validity start |
| valid_until | date nullable | validity end |
| is_promo | boolean nullable | promo/regular flag |
| confidence | numeric nullable | extraction confidence |
| raw_evidence | text nullable | snippet used for extraction |
| status | review_status | trust lifecycle |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Validation: `active` numeric facts require source evidence, reviewed status, and
non-expired validity when validity is available.

### tariff_rows

Canonical reviewed tariff row for price/route/availability answers.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| source_table_chunk_id | uuid nullable | references table_chunks |
| page_number | integer nullable | source page |
| row_number | integer nullable | source row |
| airline | text nullable | required before active trusted use |
| destination_city | text nullable | required before active trusted use |
| destination_code | text nullable | airport code when available |
| flight_number | text nullable | optional |
| route_type | route_type | required; unknown allowed before review |
| transit_route | text nullable | required for transit when known |
| smu_price_per_kg | integer nullable | required for numeric active price |
| price_status | price_status | numeric, NA, or missing |
| schedule | text nullable | optional |
| origin_city | text nullable | defaultable from document/settings |
| origin_airport | text nullable | defaultable from document/settings |
| commodity | text nullable | optional |
| effective_date | date nullable | source effective date |
| valid_from | date nullable | validity start |
| valid_until | date nullable | validity end |
| is_promo | boolean | default false |
| raw_row_text | text nullable | source row |
| source_text | text nullable | surrounding source |
| confidence | numeric nullable | extraction confidence |
| status | review_status | trust lifecycle |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Validation: active numeric rows require airline, destination, price, route type,
source evidence, and no unresolved high-severity issue.

### fee_rules

Reviewed fee and tax rules used by quote calculation.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| source_chunk_id | uuid nullable | references document_chunks |
| source_table_chunk_id | uuid nullable | references table_chunks |
| airline | text nullable | null means document/general fee rule |
| admin_fee_per_smu | integer nullable | per SMU admin fee |
| warehouse_fee_per_kg | integer nullable | per kg warehouse fee |
| warehouse_admin_per_smu | integer nullable | warehouse admin fee |
| min_weight_kg | numeric nullable | billable minimum weight |
| ppn_percent | numeric nullable | tax percent |
| dg_surcharge | integer nullable | dangerous goods surcharge |
| shipdec_note | text nullable | shipper declaration notes |
| quarantine_note | text nullable | quarantine notes |
| notes | text nullable | raw fee notes |
| status | review_status | trust lifecycle |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Validation: active fee rules require source evidence and reviewed status.

### aliases

Reviewed alias mappings for fuzzy user language.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| type | text | city, airport, airline, route, destination |
| canonical_value | text | normalized target |
| alias | text | user-facing variant |
| metadata | jsonb nullable | code, locale, confidence, notes |
| is_ambiguous | boolean | true requires clarification |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Validation: `(type, lower(alias), canonical_value)` unique; ambiguous aliases
must not be silently resolved in numeric mode.

### embeddings

Vector search index owner.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| owner_type | text | document_chunk, table_chunk, extracted_fact, tariff_row |
| owner_id | uuid | references owner by type |
| searchable_text | text | text embedded and used for debugging |
| embedding | vector | dimension matches embedding model |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Indexes: HNSW cosine vector index; owner type/id unique index.

### extraction_issues

Quality and review issue tied to source.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| source_type | text nullable | table_chunk, fact, tariff_row, fee_rule, document |
| source_id | uuid nullable | referenced source |
| issue_type | text | validation code |
| severity | issue_severity | low, medium, high |
| message | text | human-readable issue |
| status | issue_status | open, resolved, ignored |
| created_at | timestamp | required |
| updated_at | timestamp | required |

### chat_sessions

Persistent chat thread.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| title | text nullable | generated or user-edited |
| user_label | text nullable | optional local label |
| created_at | timestamp | required |
| updated_at | timestamp | required |
| deleted_at | timestamp nullable | soft delete |

### chat_messages

Chat message persisted for history.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| session_id | uuid | references chat_sessions |
| role | text | user, assistant, system, tool |
| content | text | message text or rendered fallback |
| parts | jsonb nullable | AI SDK UI message parts |
| metadata | jsonb nullable | model, usage, warnings |
| created_at | timestamp | required |

### chat_tool_calls

Visible persisted tool calls.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| session_id | uuid | references chat_sessions |
| message_id | uuid nullable | references chat_messages |
| tool_name | text | required |
| state | tool_call_state | pending/running/success/error |
| input | jsonb nullable | validated tool input |
| output | jsonb nullable | tool output summary |
| error | text nullable | error message |
| started_at | timestamp | required |
| completed_at | timestamp nullable | set on success/error |

### chat_sources

Evidence attached to assistant messages.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| session_id | uuid | references chat_sessions |
| message_id | uuid | references chat_messages |
| source_type | text | document_chunk, table_chunk, extracted_fact, tariff_row, fee_rule, document, document_page |
| source_id | uuid | referenced source |
| title | text | source display title |
| snippet | text nullable | source snippet/raw row |
| metadata | jsonb nullable | page, validity, route, fee fields |
| created_at | timestamp | required |

### answer_verifications

Stored answer verification state.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| session_id | uuid | references chat_sessions |
| message_id | uuid | references chat_messages |
| mode | answer_mode | general_rag or verified_numeric |
| confidence_state | confidence_state | final answer state |
| checks | jsonb | performed checks |
| warnings | jsonb nullable | exposed warnings |
| created_at | timestamp | required |

### settings

Admin configuration.

| Field | Type | Rules |
| ----- | ---- | ----- |
| key | text | primary key |
| value | jsonb | validated per key |
| updated_at | timestamp | required |

Settings include deployment mode, database provider, queue provider, chat model,
embedding model, temperature, max tool steps, retrieval topK, hybrid weights,
reranker flag, default origin, quote defaults, tool-call visibility, and storage
flags.

### audit_logs

Security and review audit trail.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| actor | text | admin/session/system |
| action | text | upload, extract, approve, reject, archive, setting_update, etc. |
| entity_type | text | affected entity type |
| entity_id | uuid nullable | affected entity id |
| before | jsonb nullable | prior state |
| after | jsonb nullable | new state |
| created_at | timestamp | required |

### ingestion_jobs

DB fallback queue and ingestion audit trail.

| Field | Type | Rules |
| ----- | ---- | ----- |
| id | uuid | primary key |
| document_id | uuid | references documents |
| type | text | parse, chunk, extract, embed, validate |
| status | job_status | queued/running/completed/failed |
| attempts | integer | default 0 |
| max_attempts | integer | default 3 |
| payload | jsonb nullable | job input |
| error | text nullable | last failure |
| available_at | timestamp | claim eligibility |
| started_at | timestamp nullable | current attempt start |
| completed_at | timestamp nullable | completion time |
| created_at | timestamp | required |
| updated_at | timestamp | required |

## State Transitions

### Document Lifecycle

`uploaded -> parsing -> chunked -> extracted -> needs_review -> active`

Failure/exit paths:
- Any ingestion phase may move to `failed` with `ingestion_error`.
- Admin may move active or needs_review documents to `archived` or `rejected`.

### Reviewable Records

`extracted -> needs_review -> active`

Alternative paths:
- `extracted|needs_review|active -> rejected`
- `extracted|needs_review|active -> archived`
- `rejected|archived -> needs_review` only through explicit admin reopen.

### Ingestion Job

`queued -> running -> completed`

Failure/retry paths:
- `running -> queued` when retryable and attempts remain.
- `running -> failed` when max attempts are exhausted.

## Cross-Entity Validation Rules

- Trusted numeric tools query only `status = active` for facts, tariff rows,
  table chunks, and fee rules.
- Numeric tariff answers require source evidence and validity checks.
- Quote calculation requires one active tariff row and applicable active fee
  rules; missing required fee rules lowers confidence or blocks the quote.
- Ambiguous aliases require clarification in verified numeric mode.
- Promo and regular rows cannot be silently collapsed unless the user asks for
  cheapest, latest, promo, or regular.
- Expired rows/facts are excluded unless the user explicitly asks historical
  questions.
- Uploaded artifact paths must resolve under `UPLOAD_ROOT` and outside `public/`.
- Every review, settings, upload, and admin mutation writes an audit log.
