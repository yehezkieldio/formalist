# Ingestion And Review Flow

1. Admin uploads a PDF, DOCX, or TXT document.
2. The upload API validates file type, size, storage flags, and metadata.
3. The queue enqueues ingestion work.
4. The worker parses raw text, page text, and table-like blocks.
5. The worker creates semantic chunks and table-aware chunks with source
   metadata.
6. LLM extraction creates document metadata, facts, tariff rows, and fee rules.
7. Validation creates extraction issues for missing prices, N/A rows,
   city/code mismatches, duplicate rows, missing fees, expired validity, low
   confidence, and source mismatches.
8. Admin reviews, edits, approves, rejects, or archives extracted records.
9. Only reviewed active facts, tariff rows, and fee rules can be trusted by
   verified numeric mode.

Machine extraction never activates trusted numeric data automatically.

## Source Evidence

Every high-stakes answer should trace back to document name, page when
available, chunk/table/fact/row/rule ID, raw snippet or row text, effective
date, validity period, route fields, and relevant fee rules.
