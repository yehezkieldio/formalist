import {
    deleteTableChunks,
    insertTableChunks,
} from "#/server/db/queries/chunks";

import type { TableAwareChunk } from "./chunkers/table-chunker";

export async function persistTableChunks(
    documentId: string,
    chunks: TableAwareChunk[]
) {
    await deleteTableChunks(documentId);

    return insertTableChunks(
        chunks.map((chunk) => ({
            documentId,
            headerText: chunk.headerText,
            markdown: chunk.markdown,
            metadata: chunk.metadata,
            pageNumber: chunk.pageNumber,
            rowIndex: chunk.rowIndex,
            rowText: chunk.rowText,
            status: chunk.status,
            tableIndex: chunk.tableIndex,
        }))
    );
}
