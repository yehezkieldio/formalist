import { desc, eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { documents } from "#/server/db/schema";
import type { DocumentStatus } from "#/server/db/schema";

export interface CreateDocumentInput {
    checksum?: string;
    fileType: string;
    filename: string;
    mimeType: string;
    originalPath?: string;
    sourceName?: string;
    status?: DocumentStatus;
    storeOriginalFile?: boolean;
    storePageImages?: boolean;
}

export async function createDocument(input: CreateDocumentInput) {
    const [document] = await getDatabase()
        .insert(documents)
        .values({
            checksum: input.checksum,
            fileType: input.fileType,
            filename: input.filename,
            mimeType: input.mimeType,
            originalPath: input.originalPath,
            sourceName: input.sourceName,
            status: input.status ?? "uploaded",
            storeOriginalFile: input.storeOriginalFile ?? false,
            storePageImages: input.storePageImages ?? false,
        })
        .returning();

    return document;
}

export function listDocuments(limit = 50) {
    return getDatabase()
        .select()
        .from(documents)
        .orderBy(desc(documents.updatedAt))
        .limit(limit);
}

export async function getDocument(documentId: string) {
    const [document] = await getDatabase()
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

    return document;
}

export async function updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    ingestionError?: string
) {
    const [document] = await getDatabase()
        .update(documents)
        .set({
            ingestionError,
            status,
            updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))
        .returning();

    return document;
}
