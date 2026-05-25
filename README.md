# Formalist

Formalist is an agentic RAG assistant and deterministic calculation platform designed specifically for air cargo tariff, pricelist, and rules documents. The application converts unstructured logistics files (such as PDFs, DOCX files, and spreadsheets) into structured, queryable data for cargo operators and pricing teams. It automates the parsing of complex tabular layouts, validity periods, flight schedules, and various surcharges, enabling users to request pricing information and generate shipment quotes with mathematical accuracy instead of relying on probabilistic language model generations.

## Trust Model

The platform uses two separate data retrieval paths:

- **General RAG**: For summaries, definitions, and policy questions, the assistant retrieves semantic chunks from documents and constructs answers with inline citations.
- **Verified Numeric Mode**: For prices, fees, schedules, validity periods, and routes, the assistant queries structured, reviewed, active database records.
- **Deterministic Math**: Calculations (including minimum billable weight, fuel surcharges, and tax) execute in TypeScript using `decimal.js`. The language model classifies user intent, selects tools, and explains results, but does not perform calculations.
- **Human Review**: Extracted facts, prices, and rules require administrator approval before the chatbot can access them. Machine-extracted data starts as `extracted` or `needs_review`.

## Features

### Chat Interface

- Renders streaming text responses and reasoning summaries using Vercel AI SDK v6.
- Saves conversation history in a sidebar.
- Displays inline tool execution logs, tool timelines, and source cards.
- Assigns a confidence status (such as CONFIDENT, NEEDS_CONFIRMATION, UNVERIFIED, or UNANSWERABLE) based on source verification checks.
- Provides modal dialogs to inspect the document page and snippet behind cited sources.

### Ingestion and Extraction

- Parses PDF, DOCX, and TXT files, extracting page text, semantic paragraphs, and tables.
- Extracts table rows directly using custom application code.
- Extracts notes, validity dates, and rules using structured LLM schemas with token limits.
- Normalizes currency formats, airline names, and airport codes.
- Identifies data issues including city/code mismatches, duplicate rows, promo/regular conflicts, and expired validity dates.

### Administration

- Includes dashboards to review, edit, approve, reject, or archive extracted data.
- Records all administrative events in an audit log.
- Secures admin pages using httpOnly session cookies.

### Retrieval

- Combines Postgres Full-Text Search and pgvector similarity using Reciprocal Rank Fusion (RRF).
- Resolves location and airline aliases using fuzzy matching.

## Technical Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Database**: PostgreSQL with pgvector, Drizzle ORM
- **AI**: Vercel AI SDK v6, OpenRouter provider
- **Queue**: Node.js worker supporting Redis (BullMQ), Upstash Redis REST, or DB fallback queue
- **Arithmetic**: decimal.js for weight and cost calculations
- **Document Processing**: @opendataloader/pdf, officeparser, @langchain/textsplitters, sentence-splitter

## Quick Start

### Prerequisites

- Bun (v1.x or higher)
- Docker and Docker Compose

### Setup and Running

1. Copy the environment configuration:
    ```bash
    cp .env.example .env
    ```
2. Start the database and run migrations:
    ```bash
    just db-migrate
    ```
3. Start the application and worker:
    ```bash
    just local-all
    ```
    The application is available at `http://localhost:3000`. You can log in at `/admin/login` and upload files at `/admin/documents`.

## Testing and Verification

To run formatting and lint checks:

```bash
bun run check
```

To run unit and integration tests:

```bash
bun run test
```

To run browser E2E tests:

```bash
RUN_BROWSER_E2E=1 bun run test:e2e
```

## Documentation Directory

Detailed guides are available in the docs folder:

- [Environment Configuration](docs/environment.md)
- [Ingestion and Review Flow](docs/ingestion-review-flow.md)
- [Chat Usage](docs/chat-usage.md)
- [Architecture Details](docs/architecture.md)
- [Storage and Backup](docs/storage-backup.md)
- [Known Limitations](docs/limitations.md)
