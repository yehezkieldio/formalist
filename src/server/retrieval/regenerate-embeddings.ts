import {
    deleteEmbeddingsForDocument,
    embedDocumentChunks,
    embedExtractedFacts,
    embedTableChunks,
    embedTariffRows,
} from "./embedding-jobs";

export async function regenerateEmbeddingsForDocument(documentId: string) {
    await deleteEmbeddingsForDocument(documentId);
    const [documentChunks, tableChunks, extractedFacts, tariffs] =
        await Promise.all([
            embedDocumentChunks(documentId),
            embedTableChunks(documentId),
            embedExtractedFacts(documentId),
            embedTariffRows(documentId),
        ]);

    return {
        documentChunks,
        extractedFacts,
        tableChunks,
        tariffs,
    };
}
