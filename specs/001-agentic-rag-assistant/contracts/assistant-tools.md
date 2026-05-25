# Assistant Tool Contracts

All tools are defined in `src/server/ai/tools.ts` with Zod schemas in
`src/server/ai/tool-schemas.ts`. Tool calls are persisted to `chat_tool_calls`
and surfaced in the UI. Numeric tools must never return unreviewed data as
trusted truth.

## classifyIntent

Input:

```json
{
    "message": "string",
    "sessionContext": {}
}
```

Output:

```json
{
    "intent": "general_rag | verified_numeric | quote | document_lookup | admin_status | clarification | unanswerable",
    "requiresVerifiedNumeric": true,
    "requiresQuoteCalculation": false,
    "missingInputs": ["weightKg"],
    "reason": "string"
}
```

## resolveAliases

Input:

```json
{
    "terms": ["Jogja", "Pelita"],
    "types": ["city", "airport", "airline", "destination"]
}
```

Output:

```json
{
    "resolved": [
        {
            "input": "Jogja",
            "type": "destination",
            "canonicalValue": "Yogyakarta",
            "isAmbiguous": true,
            "candidates": []
        }
    ],
    "needsClarification": true
}
```

## retrieveChunks

General RAG semantic chunk search.

Input:

```json
{
    "query": "string",
    "filters": {
        "documentId": "uuid | null",
        "airline": "string | null"
    },
    "topK": 8
}
```

Output:

```json
{
    "results": [
        {
            "sourceType": "document_chunk",
            "sourceId": "uuid",
            "score": 0.82,
            "documentId": "uuid",
            "pageNumber": 2,
            "snippet": "string"
        }
    ]
}
```

## retrieveTableChunks

Table-aware row/section retrieval.

Input and output match `retrieveChunks`, with `sourceType = table_chunk` and
row/table metadata.

## hybridSearch

Runs full-text search and vector search, then combines with RRF.

Input:

```json
{
    "query": "string",
    "filters": {},
    "topK": 12,
    "weights": {
        "fullText": 0.5,
        "vector": 0.5
    },
    "rerank": false
}
```

Output includes ranked mixed sources with component ranks and RRF score.

## searchFacts

Structured fact search.

Input:

```json
{
    "filters": {
        "factType": "tariff_price | fee_rule | validity_rule | schedule | route | destination | document_metadata | surcharge | minimum_weight | ppn | other",
        "airline": "string | null",
        "destinationCity": "string | null",
        "destinationCode": "string | null",
        "status": "active"
    }
}
```

Output: fact summaries with source evidence references.

## searchTariffs

Trusted tariff lookup for verified numeric mode.

Input:

```json
{
    "filters": {
        "airline": "string | null",
        "destinationCity": "string | null",
        "destinationCode": "string | null",
        "originCity": "string | null",
        "originAirport": "string | null",
        "routeType": "DIRECT | TRANSIT | ANY | null",
        "isPromo": "boolean | null",
        "asOfDate": "date | null",
        "status": "active"
    },
    "allowUnreviewed": false
}
```

Output:

```json
{
    "rows": [],
    "warnings": [],
    "needsClarification": false
}
```

Rules:

- `allowUnreviewed` is false for trusted numeric answers.
- Expired rows are excluded unless the query is historical.

## getFactDetails / getTariffDetails / getFeeRules

Detail tools return a single reviewed record or applicable fee rules with full
source evidence and warning issues.

## calculateQuote

Deterministic quote calculation.

Input:

```json
{
    "tariffRowId": "uuid",
    "weightKg": 20,
    "feeRuleIds": ["uuid"],
    "options": {
        "includePpn": true,
        "dangerousGoods": false
    }
}
```

Output:

```json
{
    "billableWeightKg": 20,
    "smuPricePerKg": 0,
    "baseCost": 0,
    "airlineAdminFee": 0,
    "warehouseFee": 0,
    "warehouseAdminFee": 0,
    "surcharge": 0,
    "ppn": 0,
    "total": 0,
    "currency": "IDR",
    "lines": [],
    "sourceIds": [],
    "warnings": []
}
```

Rules:

- Must be called for total price questions.
- Fails with `NEEDS_CONFIRMATION` when required active fee rules are missing.

## getSourceEvidence

Input:

```json
{
    "sourceType": "document_chunk | table_chunk | extracted_fact | tariff_row | fee_rule | document | document_page",
    "sourceId": "uuid"
}
```

Output: display title, document name, page number when available, raw snippet or
row, effective date, validity, fee details, and metadata.

## listDestinations

Lists reviewed active destinations for filters such as airline, route type,
origin, promo status, and validity.

## compareTariffs

Compares reviewed active rows for cheapest/latest/promo/regular comparison.
Returns ambiguity when promo and regular both match but the user did not specify
comparison intent.

## verifyAnswer

Input:

```json
{
    "mode": "general_rag | verified_numeric",
    "claims": [],
    "sources": [],
    "warnings": []
}
```

Output:

```json
{
    "confidenceState": "CONFIDENT | NEEDS_CONFIRMATION | UNVERIFIED | UNANSWERABLE",
    "checks": [],
    "warnings": []
}
```

## flagAmbiguity

Returns a structured clarification payload for ambiguous cities, airport codes,
airlines, promo/regular selection, date scope, weight, origin, or route type.
