import { inArray, sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { tableChunks } from "#/server/db/schema";
import type { ReviewStatus } from "#/server/db/schema";

import { getEmbeddingClient } from "./embeddings";
import type { RetrievalSource } from "./types";
import { vectorSearch } from "./vector-search";

interface TableSearchInput {
    documentId?: string;
    includeArchivedDocuments?: boolean;
    limit?: number;
    query: string;
    status?: ReviewStatus;
    validOn?: string;
}

function tableTitle(row: typeof tableChunks.$inferSelect) {
    return `Table ${row.tableIndex ?? "?"} row ${row.rowIndex ?? "?"}`;
}

async function searchTableChunksByVector(
    input: TableSearchInput
): Promise<RetrievalSource[]> {
    const embeddingClient = getEmbeddingClient();

    if (embeddingClient.status === "setup-required") {
        return [];
    }

    const vectorRows = await vectorSearch({
        documentId: input.documentId,
        embedding: await embeddingClient.embedText(input.query),
        includeArchivedDocuments: input.includeArchivedDocuments,
        limit: (input.limit ?? 10) * 4,
        ownerTypes: ["table_chunk"],
        status: input.status,
        validOn: input.validOn,
    });
    const ownerIds = vectorRows.map((row) => row.ownerId);

    if (ownerIds.length === 0) {
        return [];
    }

    const rows = await getDatabase()
        .select()
        .from(tableChunks)
        .where(inArray(tableChunks.id, ownerIds));
    const vectorRank = new Map(vectorRows.map((row) => [row.ownerId, row]));

    const sources: RetrievalSource[] = [];

    for (const row of rows) {
        const vectorResult = vectorRank.get(row.id);

        if (vectorResult) {
            sources.push({
                documentId: row.documentId,
                ownerId: row.id,
                ownerType: "table_chunk",
                pageNumber: row.pageNumber,
                score: vectorResult.score,
                snippet: row.rowText,
                title: tableTitle(row),
            });
        }
    }

    return sources
        .toSorted((left, right) => right.score - left.score)
        .slice(0, input.limit ?? 10);
}

async function searchTableChunksByText(
    input: TableSearchInput
): Promise<RetrievalSource[]> {
    const limit = input.limit ?? 10;
    const archiveFilter = input.includeArchivedDocuments
        ? sql``
        : sql`and d.status <> 'archived'`;
    const documentFilter = input.documentId
        ? sql`and tc.document_id = ${input.documentId}::uuid`
        : sql``;
    const statusFilter = input.status
        ? sql`and tc.status = ${input.status}`
        : sql``;
    const validOnFilter = input.validOn
        ? sql`
            and (d.valid_from is null or d.valid_from <= ${input.validOn}::date)
            and (d.valid_until is null or d.valid_until >= ${input.validOn}::date)
        `
        : sql``;
    const result = await getDatabase().execute(sql`
        with query as (select plainto_tsquery('simple', ${input.query}) as q)
        select
            tc.id as "ownerId",
            tc.document_id as "documentId",
            tc.page_number as "pageNumber",
            tc.table_index as "tableIndex",
            tc.row_index as "rowIndex",
            tc.row_text as snippet,
            greatest(
                ts_rank_cd(to_tsvector('simple', coalesce(tc.header_text, '') || ' ' || tc.row_text), query.q),
                case when (coalesce(tc.header_text, '') || ' ' || tc.row_text) ilike '%' || ${input.query} || '%' then 0.05 else 0 end
            ) as score
        from table_chunks tc
        join documents d on d.id = tc.document_id
        cross join query
        where 1 = 1
        ${documentFilter}
        ${statusFilter}
        ${archiveFilter}
        ${validOnFilter}
        and (
            to_tsvector('simple', coalesce(tc.header_text, '') || ' ' || tc.row_text) @@ query.q
            or (coalesce(tc.header_text, '') || ' ' || tc.row_text) ilike '%' || ${input.query} || '%'
        )
        order by score desc, tc.updated_at desc
        limit ${limit}
    `);

    return (
        result as unknown as {
            documentId: string;
            ownerId: string;
            pageNumber: number | null;
            rowIndex: number | null;
            score: number;
            snippet: string;
            tableIndex: number | null;
        }[]
    ).map((row) => ({
        documentId: row.documentId,
        ownerId: row.ownerId,
        ownerType: "table_chunk",
        pageNumber: row.pageNumber,
        score: Number(row.score),
        snippet: row.snippet,
        title: `Table ${row.tableIndex ?? "?"} row ${row.rowIndex ?? "?"}`,
    }));
}

export async function searchTableChunks(input: {
    documentId?: string;
    includeArchivedDocuments?: boolean;
    limit?: number;
    query: string;
    status?: ReviewStatus;
    validOn?: string;
}): Promise<RetrievalSource[]> {
    const [vectorResults, textResults] = await Promise.all([
        searchTableChunksByVector(input),
        searchTableChunksByText(input),
    ]);
    const sources = new Map<string, RetrievalSource>();

    for (const source of [...vectorResults, ...textResults]) {
        const existing = sources.get(source.ownerId);
        sources.set(source.ownerId, {
            ...source,
            score: Math.max(existing?.score ?? 0, source.score),
        });
    }

    return [...sources.values()]
        .toSorted((left, right) => right.score - left.score)
        .slice(0, input.limit ?? 10);
}
