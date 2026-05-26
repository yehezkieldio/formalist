import {
    deleteDocumentChunks,
    insertDocumentChunks,
} from "#/server/db/queries/chunks";

import type { SemanticDocumentChunk } from "./chunkers/document-chunker";

export async function persistDocumentChunks(
    documentId: string,
    chunks: SemanticDocumentChunk[]
) {
    await deleteDocumentChunks(documentId);

    return insertDocumentChunks(
        chunks.map((chunk) => ({
            chunkIndex: chunk.chunkIndex,
            chunkType: chunk.chunkType,
            content: chunk.content,
            documentId,
            metadata: chunk.metadata,
            pageNumber: chunk.pageNumber,
            status: "active",
        }))
    );
}
