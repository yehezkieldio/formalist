import { sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";

import type { RetrievalSource } from "./types";

export const localIndexEvaluation = {
    flexsearch:
        "Useful for small local/admin-side browser indexes, but not a replacement for Postgres FTS persistence.",
    minisearch:
        "Useful for lightweight client-side filtering; keep trusted retrieval on Postgres FTS plus pgvector.",
};

export async function fullTextSearch(input: {
    documentId?: string;
    includeArchivedDocuments?: boolean;
    limit?: number;
    ownerTypes?: string[];
    query: string;
    validOn?: string;
}): Promise<RetrievalSource[]> {
    const limit = input.limit ?? 10;
    const ownerTypeFilter =
        input.ownerTypes && input.ownerTypes.length > 0
            ? sql`and e.owner_type in (${sql.join(
                  input.ownerTypes.map((ownerType) => sql`${ownerType}`),
                  sql`, `
              )})`
            : sql``;
    const documentFilter = input.documentId
        ? sql`and coalesce(dc.document_id, tc.document_id, ef.document_id, tr.document_id) = ${input.documentId}::uuid`
        : sql``;
    const archiveFilter = input.includeArchivedDocuments
        ? sql``
        : sql`and coalesce(d.status, 'active') <> 'archived'`;
    const validOnFilter = input.validOn
        ? sql`
            and (
                coalesce(d.valid_from, ef.valid_from, tr.valid_from) is null
                or coalesce(d.valid_from, ef.valid_from, tr.valid_from) <= ${input.validOn}::date
            )
            and (
                coalesce(d.valid_until, ef.valid_until, tr.valid_until) is null
                or coalesce(d.valid_until, ef.valid_until, tr.valid_until) >= ${input.validOn}::date
            )
        `
        : sql``;
    const result = await getDatabase().execute(sql`
        with query as (select plainto_tsquery('simple', ${input.query}) as q)
        select
            e.owner_id as "ownerId",
            e.owner_type as "ownerType",
            coalesce(dc.document_id, tc.document_id, ef.document_id, tr.document_id) as "documentId",
            coalesce(dc.page_number, tc.page_number, tr.page_number) as "pageNumber",
            e.searchable_text as snippet,
            ts_rank_cd(to_tsvector('simple', e.searchable_text), query.q) as score
        from embeddings e
        left join document_chunks dc
            on e.owner_type = 'document_chunk' and e.owner_id = dc.id
        left join table_chunks tc
            on e.owner_type = 'table_chunk' and e.owner_id = tc.id
        left join extracted_facts ef
            on e.owner_type = 'extracted_fact' and e.owner_id = ef.id
        left join tariff_rows tr
            on e.owner_type = 'tariff_row' and e.owner_id = tr.id
        left join documents d
            on d.id = coalesce(dc.document_id, tc.document_id, ef.document_id, tr.document_id)
        cross join query
        where to_tsvector('simple', e.searchable_text) @@ query.q
        ${ownerTypeFilter}
        ${documentFilter}
        ${archiveFilter}
        ${validOnFilter}
        order by score desc, e.updated_at desc
        limit ${limit}
    `);

    return result as unknown as RetrievalSource[];
}
