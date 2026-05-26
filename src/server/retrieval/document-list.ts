import { listDocumentsWithReviewSummary } from "#/server/db/queries/documents";

export async function listDocumentInventory(input: { limit?: number } = {}) {
    const documents = await listDocumentsWithReviewSummary(input.limit ?? 20);

    return documents.map((document) => ({
        createdAt: document.createdAt,
        filename: document.filename,
        id: document.id,
        issueCount: document.issueCount,
        mimeType: document.mimeType,
        reviewCount: document.reviewCount,
        sourceName: document.sourceName,
        status: document.status,
        updatedAt: document.updatedAt,
    }));
}
