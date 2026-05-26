CREATE INDEX IF NOT EXISTS "document_chunks_content_fts_idx"
ON "document_chunks"
USING gin (to_tsvector('simple', coalesce("content", '')));

CREATE INDEX IF NOT EXISTS "table_chunks_text_fts_idx"
ON "table_chunks"
USING gin (
    to_tsvector(
        'simple',
        coalesce("header_text", '') || ' ' || coalesce("row_text", '') || ' ' || coalesce("markdown", '')
    )
);

CREATE INDEX IF NOT EXISTS "extracted_facts_text_fts_idx"
ON "extracted_facts"
USING gin (
    to_tsvector(
        'simple',
        coalesce("subject", '') || ' ' ||
        coalesce("predicate", '') || ' ' ||
        coalesce("value_text", '') || ' ' ||
        coalesce("raw_evidence", '')
    )
);

CREATE INDEX IF NOT EXISTS "tariff_rows_text_fts_idx"
ON "tariff_rows"
USING gin (
    to_tsvector(
        'simple',
        coalesce("airline", '') || ' ' ||
        coalesce("destination_city", '') || ' ' ||
        coalesce("destination_code", '') || ' ' ||
        coalesce("raw_row_text", '') || ' ' ||
        coalesce("source_text", '')
    )
);

CREATE INDEX IF NOT EXISTS "fee_rules_text_fts_idx"
ON "fee_rules"
USING gin (
    to_tsvector(
        'simple',
        coalesce("airline", '') || ' ' ||
        coalesce("notes", '') || ' ' ||
        coalesce("shipdec_note", '') || ' ' ||
        coalesce("quarantine_note", '')
    )
);
