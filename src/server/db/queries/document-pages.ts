import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { documentPages } from "#/server/db/schema";

export interface UpsertDocumentPageInput {
    documentId: string;
    pageImagePath?: string;
    pageNumber: number;
    rawText?: string;
}

export function upsertDocumentPages(pages: UpsertDocumentPageInput[]) {
    if (pages.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase()
        .insert(documentPages)
        .values(pages)
        .onConflictDoUpdate({
            set: {
                pageImagePath: sql.raw("excluded.page_image_path"),
                rawText: sql.raw("excluded.raw_text"),
            },
            target: [documentPages.documentId, documentPages.pageNumber],
        })
        .returning();
}

export function listDocumentPages(documentId: string) {
    return getDatabase()
        .select()
        .from(documentPages)
        .where(eq(documentPages.documentId, documentId));
}

export async function getDocumentPage(documentId: string, pageNumber: number) {
    const [page] = await getDatabase()
        .select()
        .from(documentPages)
        .where(
            and(
                eq(documentPages.documentId, documentId),
                eq(documentPages.pageNumber, pageNumber)
            )
        )
        .limit(1);

    return page;
}
