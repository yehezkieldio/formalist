# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [Postgres + pgvector, Redis, local filesystem artifacts, or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [Docker local/VPS, managed providers, browser, or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Agentic RAG Champion**: Plan identifies how the chatbot plans, retrieves,
  calls tools, verifies, calculates, streams, and cites responses, or states why
  the feature is outside chat orchestration.
- **Multiple Document Memories**: Ingestion changes define semantic chunks,
  table-aware chunks, structured facts, source references, optional artifacts,
  and chat/tool-call history impacts.
- **Verified Numeric Mode**: Price, fee, total, schedule, validity, route,
  destination, promo, and quote behavior uses reviewed active facts/table rows
  or deterministic calculations. Raw chunks alone are not accepted.
- **Human Review Before Trust**: Extracted facts and tariff rows start as
  `extracted` or `needs_review`; admin approval is required before active use.
- **Deterministic Calculation**: Quote and fee math is implemented in TypeScript
  application code with unit tests; LLM output never performs source arithmetic.
- **Source Traceability**: High-stakes answers expose document name, page when
  available, chunk/table/fact reference, snippet or row text, effective date,
  validity period, and fee rules.
- **Product Quality**: User-facing work preserves streaming chat, persistent
  history, sidebar navigation, message actions, visible tool calls, visible
  reasoning summaries, citations, source cards, confidence states, markdown, and
  responsive UI as applicable.
- **Deployment And Storage**: Plan supports Docker local/VPS with local
  Postgres + pgvector and Redis, plus managed Supabase + Upstash mode through
  environment-based provider selection. Optional files/page artifacts use local
  filesystem storage with configuration flags.
- **Security**: Admin routes are protected, secrets come from environment
  variables, uploads/artifacts are outside the public web root, and file access
  paths are validated.
- **Modular Boundaries**: Plan names owning modules for ingestion, parsing,
  chunking, extraction, validation, retrieval, chat orchestration, tool calling,
  quote calculation, provider adapters, storage, and UI changes.
- **Graceful Degradation**: App behavior without `OPENROUTER_API_KEY` is
  specified; non-LLM admin, stored document, review, lookup, and deterministic
  calculation paths remain usable.
- **Scope Exclusions**: Plan does not introduce seed demo tariff data or an
  eval/test-question dashboard.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
