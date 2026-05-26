import { inArray, sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { documentChunks } from "#/server/db/schema";

import { getEmbeddingClient } from "./embeddings";
import { getSqlRows } from "./sql-rows";
import type { RetrievalSource } from "./types";
import { vectorSearch } from "./vector-search";

interface ChunkSearchInput {
    documentId?: string;
    includeArchivedDocuments?: boolean;
    limit?: number;
    query: string;
    validOn?: string;
}

function orderedVectorSources(
    rows: (typeof documentChunks.$inferSelect)[],
    vectorRank: Map<string, { score: number; snippet: string }>
): RetrievalSource[] {
    const sources: RetrievalSource[] = [];

    for (const row of rows) {
        const vectorResult = vectorRank.get(row.id);

        if (vectorResult) {
            sources.push({
                documentId: row.documentId,
                ownerId: row.id,
                ownerType: "document_chunk",
                pageNumber: row.pageNumber,
                score: vectorResult.score,
                snippet: row.content.slice(0, 500),
                title: `Chunk ${row.chunkIndex}`,
            });
        }
    }

    return sources.toSorted((left, right) => right.score - left.score);
}

async function searchDocumentChunksByVector(
    input: ChunkSearchInput
): Promise<RetrievalSource[]> {
    const embeddingClient = getEmbeddingClient();

    if (embeddingClient.status === "setup-required") {
        return [];
    }

    const embedding = await embeddingClient.embedText(input.query);
    const vectorRows = await vectorSearch({
        documentId: input.documentId,
        embedding,
        includeArchivedDocuments: input.includeArchivedDocuments,
        limit: (input.limit ?? 10) * 4,
        ownerTypes: ["document_chunk"],
        status: "active",
        validOn: input.validOn,
    });
    const ownerIds = vectorRows.map((row) => row.ownerId);

    if (ownerIds.length === 0) {
        return [];
    }

    const rows = await getDatabase()
        .select()
        .from(documentChunks)
        .where(inArray(documentChunks.id, ownerIds));
    const vectorRank = new Map(
        vectorRows.map((row) => [
            row.ownerId,
            { score: row.score, snippet: row.searchableText },
        ])
    );

    return orderedVectorSources(rows, vectorRank).slice(0, input.limit ?? 10);
}

async function searchDocumentChunksByText(
    input: ChunkSearchInput
): Promise<RetrievalSource[]> {
    const limit = input.limit ?? 10;
    const archiveFilter = input.includeArchivedDocuments
        ? sql``
        : sql`and d.status <> 'archived'`;
    const documentFilter = input.documentId
        ? sql`and dc.document_id = ${input.documentId}::uuid`
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
            dc.id as "ownerId",
            dc.document_id as "documentId",
            dc.page_number as "pageNumber",
            dc.chunk_index as "chunkIndex",
            dc.content as snippet,
            greatest(
                ts_rank_cd(to_tsvector('simple', dc.content), query.q),
                case when dc.content ilike '%' || ${input.query} || '%' then 0.05 else 0 end
            ) as score
        from document_chunks dc
        join documents d on d.id = dc.document_id
        cross join query
        where dc.status = 'active'
        ${documentFilter}
        ${archiveFilter}
        ${validOnFilter}
        and (
            to_tsvector('simple', dc.content) @@ query.q
            or dc.content ilike '%' || ${input.query} || '%'
        )
        order by score desc, dc.updated_at desc
        limit ${limit}
    `);

    return getSqlRows<{
        chunkIndex: number;
        documentId: string;
        ownerId: string;
        pageNumber: number | null;
        score: number;
        snippet: string;
    }>(result).map((row) => ({
        documentId: row.documentId,
        ownerId: row.ownerId,
        ownerType: "document_chunk",
        pageNumber: row.pageNumber,
        score: Number(row.score),
        snippet: row.snippet.slice(0, 500),
        title: `Chunk ${row.chunkIndex}`,
    }));
}

export async function searchDocumentChunks(input: {
    documentId?: string;
    includeArchivedDocuments?: boolean;
    limit?: number;
    query: string;
    validOn?: string;
}): Promise<RetrievalSource[]> {
    const [vectorResults, textResults] = await Promise.all([
        searchDocumentChunksByVector(input),
        searchDocumentChunksByText(input),
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
