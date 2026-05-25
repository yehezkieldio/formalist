import { desc, eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import {
    documentChunks,
    documents,
    extractionIssues,
    extractedFacts,
    feeRules,
    tableChunks,
    tariffRows,
} from "#/server/db/schema";
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

export async function listDocumentsWithReviewSummary(limit = 50) {
    const rows = await listDocuments(limit);

    return Promise.all(
        rows.map(async (document) => {
            const [issues, facts, tariffs, fees] = await Promise.all([
                getDatabase()
                    .select({ id: extractionIssues.id })
                    .from(extractionIssues)
                    .where(eq(extractionIssues.documentId, document.id)),
                getDatabase()
                    .select({ id: extractedFacts.id })
                    .from(extractedFacts)
                    .where(eq(extractedFacts.documentId, document.id)),
                getDatabase()
                    .select({ id: tariffRows.id })
                    .from(tariffRows)
                    .where(eq(tariffRows.documentId, document.id)),
                getDatabase()
                    .select({ id: feeRules.id })
                    .from(feeRules)
                    .where(eq(feeRules.documentId, document.id)),
            ]);

            return {
                ...document,
                issueCount: issues.length,
                reviewCount: facts.length + tariffs.length + fees.length,
            };
        })
    );
}

export async function getDocument(documentId: string) {
    const [document] = await getDatabase()
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

    return document;
}

export async function getDocumentDetail(documentId: string) {
    const document = await getDocument(documentId);

    if (!document) {
        return;
    }

    const [issues, facts, tariffs, fees, chunks, tables] = await Promise.all([
        getDatabase()
            .select()
            .from(extractionIssues)
            .where(eq(extractionIssues.documentId, documentId)),
        getDatabase()
            .select()
            .from(extractedFacts)
            .where(eq(extractedFacts.documentId, documentId)),
        getDatabase()
            .select()
            .from(tariffRows)
            .where(eq(tariffRows.documentId, documentId)),
        getDatabase()
            .select()
            .from(feeRules)
            .where(eq(feeRules.documentId, documentId)),
        getDatabase()
            .select()
            .from(documentChunks)
            .where(eq(documentChunks.documentId, documentId)),
        getDatabase()
            .select()
            .from(tableChunks)
            .where(eq(tableChunks.documentId, documentId)),
    ]);

    return {
        chunks,
        document,
        facts,
        feeRules: fees,
        issues,
        tableChunks: tables,
        tariffRows: tariffs,
    };
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

export async function updateDocumentOriginalPath(
    documentId: string,
    originalPath: string
) {
    const [document] = await getDatabase()
        .update(documents)
        .set({ originalPath, updatedAt: new Date() })
        .where(eq(documents.id, documentId))
        .returning();

    return document;
}

export async function updateDocumentMetadata(
    documentId: string,
    input: Partial<{
        commodity: string | null;
        effectiveDate: string | null;
        isPromo: boolean | null;
        originAirport: string | null;
        originCity: string | null;
        validFrom: string | null;
        validUntil: string | null;
    }>
) {
    const [document] = await getDatabase()
        .update(documents)
        .set({
            commodity: input.commodity ?? undefined,
            effectiveDate: input.effectiveDate ?? undefined,
            isPromo: input.isPromo ?? undefined,
            originAirport: input.originAirport ?? undefined,
            originCity: input.originCity ?? undefined,
            updatedAt: new Date(),
            validFrom: input.validFrom ?? undefined,
            validUntil: input.validUntil ?? undefined,
        })
        .where(eq(documents.id, documentId))
        .returning();

    return document;
}
