import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { documentChunks } from "#/server/db/schema";

import type { RetrievalSource } from "./types";

export async function searchDocumentChunks(input: {
    documentId?: string;
    limit?: number;
    query: string;
}): Promise<RetrievalSource[]> {
    const rows = input.documentId
        ? await getDatabase()
              .select()
              .from(documentChunks)
              .where(eq(documentChunks.documentId, input.documentId))
        : await getDatabase().select().from(documentChunks);

    return rows
        .filter((row) =>
            row.content.toLowerCase().includes(input.query.toLowerCase())
        )
        .slice(0, input.limit ?? 10)
        .map((row, index) => ({
            documentId: row.documentId,
            ownerId: row.id,
            ownerType: "document_chunk",
            pageNumber: row.pageNumber,
            score: 1 / (index + 1),
            snippet: row.content.slice(0, 500),
            title: `Chunk ${row.chunkIndex}`,
        }));
}
