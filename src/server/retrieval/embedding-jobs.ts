import { eq, sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import {
    documentChunks,
    embeddings,
    extractedFacts,
    tableChunks,
    tariffRows,
} from "#/server/db/schema";
import type { EmbeddingOwnerType } from "#/server/db/schema";

import { buildSearchableText, getEmbeddingClient } from "./embeddings";
import type { SearchableSource } from "./embeddings";

export async function upsertEmbedding(input: {
    embedding: number[];
    ownerId: string;
    ownerType: EmbeddingOwnerType;
    searchableText: string;
}) {
    const [record] = await getDatabase()
        .insert(embeddings)
        .values(input)
        .onConflictDoUpdate({
            set: {
                embedding: input.embedding,
                searchableText: input.searchableText,
                updatedAt: new Date(),
            },
            target: [embeddings.ownerType, embeddings.ownerId],
        })
        .returning();

    return record;
}

async function embedSources(
    ownerType: EmbeddingOwnerType,
    sources: SearchableSource[]
) {
    const client = getEmbeddingClient();

    if (client.status === "setup-required") {
        return {
            embedded: 0,
            reason: client.reason,
            status: "setup-required" as const,
        };
    }

    for (const source of sources) {
        const searchableText = buildSearchableText(ownerType, source);
        const embedding = await client.embedText(searchableText);
        await upsertEmbedding({
            embedding,
            ownerId: source.id,
            ownerType,
            searchableText,
        });
    }

    return {
        embedded: sources.length,
        status: "ready" as const,
    };
}

export async function embedDocumentChunks(documentId: string) {
    const rows = await getDatabase()
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, documentId));

    return embedSources("document_chunk", rows);
}

export async function embedTableChunks(documentId: string) {
    const rows = await getDatabase()
        .select()
        .from(tableChunks)
        .where(eq(tableChunks.documentId, documentId));

    return embedSources("table_chunk", rows);
}

export async function embedExtractedFacts(documentId: string) {
    const rows = await getDatabase()
        .select()
        .from(extractedFacts)
        .where(eq(extractedFacts.documentId, documentId));

    return embedSources("extracted_fact", rows);
}

export async function embedTariffRows(documentId: string) {
    const rows = await getDatabase()
        .select()
        .from(tariffRows)
        .where(eq(tariffRows.documentId, documentId));

    return embedSources("tariff_row", rows);
}

export async function deleteEmbeddingsForDocument(documentId: string) {
    await getDatabase().execute(sql`
        delete from embeddings
        where owner_id in (
            select id from document_chunks where document_id = ${documentId}
            union select id from table_chunks where document_id = ${documentId}
            union select id from extracted_facts where document_id = ${documentId}
            union select id from tariff_rows where document_id = ${documentId}
        )
    `);
}
