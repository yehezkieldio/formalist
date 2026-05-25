# API Contracts: Formalist

All API routes live under `src/app/api/**/route.ts`, use JSON unless noted,
validate input with Zod, require admin session for admin routes, and return
structured errors:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Chat

### POST `/api/chat`

Streams an assistant response for a session.

Request:

```json
{
  "sessionId": "uuid | null",
  "messages": [],
  "clientOptions": {
    "showToolCalls": true
  }
}
```

Response: AI SDK UI message stream.

Side effects:
- Creates session when `sessionId` is null.
- Persists user message, assistant message parts, tool calls, sources, and
  answer verification.
- Returns setup-required stream state when `OPENROUTER_API_KEY` is missing.

### GET `/api/chat/sessions`

Returns non-deleted chat sessions ordered by update time.

Query: `q`, `limit`, `cursor`

### POST `/api/chat/sessions`

Creates a new chat session.

Request:

```json
{
  "title": "string | null"
}
```

### PATCH `/api/chat/sessions/{sessionId}`

Renames or soft-deletes a session.

Request:

```json
{
  "title": "string | null",
  "deleted": false
}
```

### GET `/api/chat/sessions/{sessionId}/messages`

Returns messages, visible tool calls, sources, and answer verification for a
session.

## Upload And Documents

### POST `/api/upload`

Admin-only multipart upload.

Fields:
- `file`: PDF, DOCX, or TXT
- `storeOriginalFile`: boolean
- `storePageImages`: boolean
- `storeDebugArtifacts`: boolean
- optional metadata: `sourceName`, `originCity`, `originAirport`, `commodity`

Response:

```json
{
  "documentId": "uuid",
  "jobId": "uuid",
  "status": "uploaded"
}
```

Validation:
- File type and size must pass `MAX_UPLOAD_MB`.
- Stored paths must resolve below `UPLOAD_ROOT` and outside public assets.

### GET `/api/documents`

Admin-only document listing.

Query: `status`, `q`, `limit`, `cursor`

### GET `/api/documents/{documentId}`

Admin-only document details with pages, ingestion jobs, issue counts, review
counts, and source metadata.

### PATCH `/api/documents/{documentId}`

Admin-only document metadata/status update.

### POST `/api/documents/{documentId}/reingest`

Admin-only reingestion request. Enqueues a new ingestion job while preserving
audit history.

## Chunks And Facts

### GET `/api/chunks`

Admin-only list for document chunks and table chunks.

Query: `documentId`, `kind=document|table`, `status`, `q`, `page`, `limit`,
`cursor`

### GET `/api/facts`

Admin-only structured fact listing.

Query: `documentId`, `factType`, `status`, `airline`, `destination`, `q`,
`limit`, `cursor`

### GET `/api/facts/{factId}`

Admin-only fact detail with source evidence and issue references.

## Review

### GET `/api/review/tariff-rows`

Admin-only tariff row review listing.

Query: `documentId`, `status`, `airline`, `destination`, `issueType`, `limit`,
`cursor`

### PATCH `/api/review/tariff-rows/{rowId}`

Admin-only edit/review action.

Request:

```json
{
  "fields": {
    "airline": "string | null",
    "destinationCity": "string | null",
    "destinationCode": "string | null",
    "routeType": "DIRECT | TRANSIT | ANY | UNKNOWN",
    "smuPricePerKg": 0,
    "priceStatus": "NUMERIC | NA | MISSING",
    "schedule": "string | null",
    "validFrom": "date | null",
    "validUntil": "date | null",
    "isPromo": false
  },
  "action": "save | approve | reject | archive | reopen",
  "note": "string | null"
}
```

Rules:
- `approve` requires source evidence and no unresolved high-severity blocking
  issue.
- Every action writes an audit log.

### GET `/api/review/fee-rules`

Admin-only fee rule review listing.

### PATCH `/api/review/fee-rules/{ruleId}`

Admin-only fee rule edit/review action.

### PATCH `/api/facts/{factId}`

Admin-only fact edit/review action.

## Aliases

### GET `/api/aliases`

Admin-only alias listing.

Query: `type`, `q`, `isAmbiguous`, `limit`, `cursor`

### POST `/api/aliases`

Admin-only alias creation.

Request:

```json
{
  "type": "city | airport | airline | route | destination",
  "canonicalValue": "string",
  "alias": "string",
  "isAmbiguous": false,
  "metadata": {}
}
```

### PATCH `/api/aliases/{aliasId}`

Admin-only alias update.

### DELETE `/api/aliases/{aliasId}`

Admin-only alias deletion with audit log.

## Extraction Issues And Audit Logs

### GET `/api/extraction-issues`

Admin-only issue listing.

Query: `documentId`, `sourceType`, `issueType`, `severity`, `status`, `limit`,
`cursor`

### PATCH `/api/extraction-issues/{issueId}`

Admin-only issue resolution or ignore.

### GET `/api/audit-logs`

Admin-only audit listing.

Query: `actor`, `action`, `entityType`, `entityId`, `from`, `to`, `limit`,
`cursor`

## Settings

### GET `/api/settings`

Admin-only settings bundle, with secret values redacted.

### PATCH `/api/settings`

Admin-only settings update.

Request keys:
- `deploymentMode`
- `databaseProvider`
- `queueProvider`
- `chatModel`
- `embeddingModel`
- `temperature`
- `maxToolSteps`
- `retrievalTopK`
- `hybridSearchWeights`
- `rerankerEnabled`
- `defaultOriginCity`
- `defaultOriginAirport`
- `defaultQuoteBehavior`
- `showToolCallsByDefault`
- `storeOriginalFiles`
- `storePageImages`
- `storeDebugArtifacts`

Rules:
- Environment-provided secrets are never returned.
- Invalid provider combinations return validation errors.

## Source Evidence

### GET `/api/source/{sourceType}/{sourceId}`

Returns source preview data for chat source cards.

Supported `sourceType`: `document_chunk`, `table_chunk`, `extracted_fact`,
`tariff_row`, `fee_rule`, `document`, `document_page`.
