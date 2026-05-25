import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { documentChunks, tableChunks } from "#/server/db/schema";
import type { ChunkStatus, ChunkType, ReviewStatus } from "#/server/db/schema";

export interface InsertDocumentChunkInput {
    chunkIndex: number;
    chunkType: ChunkType;
    content: string;
    documentId: string;
    metadata?: unknown;
    pageNumber?: number;
    status?: ChunkStatus;
}

export interface InsertTableChunkInput {
    documentId: string;
    headerText?: string;
    markdown?: string;
    metadata?: unknown;
    pageNumber?: number;
    rowIndex?: number;
    rowText: string;
    status?: ReviewStatus;
    tableIndex?: number;
}

export function insertDocumentChunks(chunks: InsertDocumentChunkInput[]) {
    if (chunks.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase().insert(documentChunks).values(chunks).returning();
}

export function insertTableChunks(chunks: InsertTableChunkInput[]) {
    if (chunks.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase().insert(tableChunks).values(chunks).returning();
}

export function deleteDocumentChunks(documentId: string) {
    return getDatabase()
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, documentId));
}

export function deleteTableChunks(documentId: string) {
    return getDatabase()
        .delete(tableChunks)
        .where(eq(tableChunks.documentId, documentId));
}
