<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder principles -> I. Agentic RAG Is The Product Champion
- Placeholder principles -> II. Documents Become Multiple Memories
- Placeholder principles -> III. Numeric Answers Require Verified Facts
- Placeholder principles -> IV. Human Review Before Trust
- Placeholder principles -> V. Deterministic Quote Calculation
- Placeholder principles -> VI. Source Traceability For High-Stakes Answers
- Placeholder principles -> VII. ChatGPT-Like Product Quality
- Placeholder principles -> VIII. Flexible Deployment And Self-Hosted Storage
- Placeholder principles -> IX. Security And Secret Hygiene
- Placeholder principles -> X. Separated, Maintainable Boundaries
- Placeholder principles -> XI. Graceful Degradation
- Placeholder principles -> XII. No Seed Tariffs Or Eval Dashboard
Added sections:
- Product Constraints
- Development Workflow
Removed sections:
- None
Templates requiring updates:
- UPDATED .specify/templates/plan-template.md
- UPDATED .specify/templates/spec-template.md
- UPDATED .specify/templates/tasks-template.md
- UPDATED .specify/templates/commands/*.md (directory absent)
- UPDATED AGENTS.md
Follow-up TODOs:
- None
-->

# Formalist Constitution

## Core Principles

### I. Agentic RAG Is The Product Champion

Formalist MUST be designed around a streaming, agentic chatbot as the primary
product surface. The assistant MUST be able to plan, retrieve, decompose
questions, call tools, cross-reference sources, verify answers, calculate when
needed, and stream source-grounded final responses. General document Q&A MAY
answer from retrieved semantic or table-aware chunks with citations when the
question does not ask for high-stakes numeric or availability information.

Rationale: Formalist exists to answer tariff and pricelist questions through a
conversational agent, not as a passive document repository.

### II. Documents Become Multiple Memories

Every ingestion design MUST convert PDF, DOCX, and TXT inputs into multiple
queryable memories: semantic document chunks, table-aware chunks, extracted
structured facts, source references, optional original file/page artifacts, and
chat/tool-call history where relevant. Each memory type MUST keep provenance
linkage back to the source document and location metadata.

Rationale: Air cargo documents mix prose, tables, rules, and evidence trails;
single-vector chunk storage is insufficient for reliable answers.

### III. Numeric Answers Require Verified Facts

For prices, fees, totals, validity dates, schedules, route availability,
destination availability, promo versus regular comparisons, and quote
calculation, the assistant MUST use reviewed active facts, reviewed active table
rows, or deterministic calculations based on reviewed facts. Raw retrieved
chunks alone MUST NOT be treated as trusted evidence for numeric answers.
Machine-extracted facts or rows with `extracted` or `needs_review` status MAY
support admin review workflows but MUST NOT power trusted numeric responses.

Rationale: Tariff mistakes create material business risk, so high-stakes numeric
answers require a stricter trust path than general RAG.

### IV. Human Review Before Trust

Machine extraction MUST NOT activate tariff rows, fee rules, schedules, route
rules, validity periods, or structured facts automatically. Extracted records
MUST start as `extracted` or `needs_review`, and an admin approval action is
required before they become active trusted facts. Admin review history MUST be
auditable enough to identify what changed, who approved it when authentication
is available, and which source evidence was reviewed.

Rationale: Human review is the control that separates draft extraction from
trusted operational knowledge.

### V. Deterministic Quote Calculation

Quote totals, fee totals, discounts, minimum charges, surcharges, and comparable
numeric outputs MUST be calculated by TypeScript application code. The LLM MAY
select tools, request missing inputs, explain the calculation, and cite the
inputs used, but it MUST NOT be the source of arithmetic or rule execution.
Calculation code MUST be unit tested across boundary cases and currency/weight
edge cases relevant to air cargo tariffs.

Rationale: Repeatable calculations require deterministic code, not probabilistic
language model output.

### VI. Source Traceability For High-Stakes Answers

Every price, fee, route, schedule, availability, validity, or quote answer MUST
include source evidence: document name, page number when available, chunk,
table, or fact reference, raw text snippet or row text, effective date, validity
period, and relevant fee rules. If required source evidence is missing, the
assistant MUST lower confidence, ask for clarification, or refuse to provide a
trusted numeric answer.

Rationale: Users must be able to audit how each high-stakes answer was derived.

### VII. ChatGPT-Like Product Quality

The chatbot MUST provide streaming responses, persistent chat history,
conversation sidebar, message actions, visible tool calls, visible reasoning
summaries, inline citations, source cards, confidence states, markdown
rendering, and a polished responsive UI. The UI MUST prioritize the chat product
over admin utilities and MUST make evidence, tool usage, and confidence visible
without exposing private chain-of-thought text.

Rationale: The main product is a professional assistant experience for repeated
document-backed conversations.

### VIII. Flexible Deployment And Self-Hosted Storage

Formalist MUST support Docker local/VPS mode with local Postgres + pgvector and
local Redis, plus managed fallback mode with Supabase Postgres + pgvector and
Upstash Redis. Provider selection MUST be environment-based and MUST NOT
hard-code Docker-only assumptions. Optional original files and page images MUST
use local filesystem storage in the first version, with configuration flags for
storing or skipping original files and page artifacts. S3, Supabase Storage, R2,
or other managed object storage MUST NOT be required in the first version.

Rationale: The project needs a self-hosted-first path while remaining portable
to managed infrastructure where useful.

### IX. Security And Secret Hygiene

Admin routes MUST be protected. API keys and secrets MUST come from environment
variables and MUST never be committed. Uploaded source files, derived artifacts,
and page images MUST NOT be stored under the public web root. File handling MUST
validate type, size, and access paths before parsing or serving artifacts.

Rationale: Tariff documents, credentials, and admin workflows are sensitive
business assets.

### X. Separated, Maintainable Boundaries

Ingestion, parsing, chunking, extraction, validation, retrieval, chat
orchestration, tool calling, quote calculation, provider adapters, storage, and
UI MUST remain separated modules with explicit contracts. Shared shortcuts,
hidden global state, and god files MUST be rejected unless a plan documents a
short-lived migration path. Each feature plan MUST identify the owning boundary
for new behavior.

Rationale: Formalist combines many workflows; maintainability depends on clear
ownership and replaceable components.

### XI. Graceful Degradation

The app MUST boot without `OPENROUTER_API_KEY`. Non-LLM admin pages, stored
documents, stored chunks, manual review, deterministic lookup, and deterministic
calculation MUST still work without the key. LLM extraction and chat features
MUST show setup-required states until required credentials are provided.

Rationale: Operators need deterministic and administrative workflows even before
LLM credentials are configured.

### XII. No Seed Tariffs Or Eval Dashboard

The first version MUST NOT include seed demo tariff data and MUST NOT implement
an eval or test-question dashboard. Unit, integration, contract, and workflow
tests remain required where the implementation creates calculation, ingestion,
retrieval, review, provider, storage, API, or UI behavior.

Rationale: Demo data and eval dashboards would obscure the real product scope;
tests still protect correctness.

## Product Constraints

Formalist's first domain is air cargo tariff and pricelist documents containing
prices, fees, schedules, promo validity, route rules, destination availability,
and quote inputs. Features that touch this domain MUST classify requirements as
general RAG, verified numeric mode, deterministic calculation, admin review, or
source/audit behavior.

Plans MUST support both local Docker/VPS and managed provider deployment modes
unless the feature is explicitly marked as provider-neutral. Storage designs
MUST treat original files and page images as optional local filesystem artifacts,
not mandatory managed object storage. Features MUST define how they behave when
LLM credentials are missing.

## Development Workflow

Every feature specification MUST state which user stories involve high-stakes
numeric information and which source evidence must be shown. Every plan MUST
pass a constitution check covering agentic RAG, multi-memory ingestion, verified
numeric mode, human review, deterministic calculations, source traceability,
deployment providers, self-hosted storage, security, modular boundaries,
graceful degradation, and the ban on seed tariff data and eval dashboards.

Tasks MUST be organized into independently reviewable vertical slices with
explicit goals, files, implementation notes, acceptance criteria, and
verification commands. Tests are required for deterministic calculation,
ingestion/parsing contracts, review state transitions, retrieval/verifier logic,
provider selection, storage access controls, protected routes, and critical chat
or admin workflows. Browser verification is required for user-facing chat and
admin review experiences.

## Governance

This constitution supersedes conflicting implementation plans, templates, and
informal practices. Amendments require a written change to this file, an updated
Sync Impact Report, and propagation to affected Spec Kit templates or runtime
guidance. Feature plans and reviews MUST cite how they satisfy applicable
principles, and unresolved violations MUST appear in Complexity Tracking with a
specific rationale and rejected simpler alternative.

Versioning follows semantic governance rules. MAJOR versions remove or redefine
principles in a backward-incompatible way. MINOR versions add principles or
materially expand required behavior. PATCH versions clarify language without
changing required behavior. Initial ratification is version 1.0.0.

Compliance review is required before implementation tasks are accepted as ready.
Reviewers MUST block work that trusts unreviewed numeric extraction, performs
LLM arithmetic, lacks source traceability for high-stakes answers, stores
uploads publicly, hard-codes one deployment provider, or introduces seed tariff
data or an eval dashboard.

**Version**: 1.0.0 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
