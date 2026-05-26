import { sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import type { EmbeddingOwnerType, ReviewStatus } from "#/server/db/schema";

import { getSqlRows } from "./sql-rows";

export interface VectorSearchResult {
    ownerId: string;
    ownerType: EmbeddingOwnerType;
    score: number;
    searchableText: string;
}

export function vectorToSqlLiteral(vector: number[]) {
    return `[${vector.join(",")}]`;
}

export async function vectorSearch(input: {
    documentId?: string;
    embedding: number[];
    includeArchivedDocuments?: boolean;
    limit?: number;
    ownerTypes?: EmbeddingOwnerType[];
    status?: ReviewStatus | "active";
    validOn?: string;
}): Promise<VectorSearchResult[]> {
    const limit = input.limit ?? 10;
    const vectorLiteral = vectorToSqlLiteral(input.embedding);
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
    const statusFilter = input.status
        ? sql`and coalesce(dc.status, tc.status, ef.status, tr.status) = ${input.status}`
        : sql``;
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
        select
            e.owner_id as "ownerId",
            e.owner_type as "ownerType",
            e.searchable_text as "searchableText",
            1 - (e.embedding <=> ${vectorLiteral}::vector) as score
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
        where e.embedding is not null
        ${ownerTypeFilter}
        ${documentFilter}
        ${archiveFilter}
        ${statusFilter}
        ${validOnFilter}
        order by e.embedding <=> ${vectorLiteral}::vector
        limit ${limit}
    `);

    return getSqlRows<VectorSearchResult>(result);
}
