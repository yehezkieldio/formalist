import { describe, expect, it, vi } from "vitest";

const chunkQueryMock = {
    deleteDocumentChunks: vi.fn(() => Promise.resolve()),
    deleteTableChunks: vi.fn(() => Promise.resolve()),
    insertDocumentChunks: vi.fn((chunks) => Promise.resolve(chunks)),
    insertTableChunks: vi.fn((chunks) => Promise.resolve(chunks)),
};

vi.mock("#/server/db/queries/chunks", () => chunkQueryMock);

describe("chunk persistence payloads", () => {
    it("persists document chunks with active status", async () => {
        const { persistDocumentChunks } =
            await import("#/server/ingestion/persist-chunks");

        await persistDocumentChunks("doc-1", [
            {
                chunkIndex: 0,
                chunkType: "narrative",
                content: "Body",
                metadata: {
                    documentId: "doc-1",
                    sourceDocumentId: "doc-1",
                },
                pageNumber: 1,
            },
        ]);

        expect(chunkQueryMock.deleteDocumentChunks).toHaveBeenCalledWith(
            "doc-1"
        );
        expect(chunkQueryMock.insertDocumentChunks).toHaveBeenCalledWith([
            {
                chunkIndex: 0,
                chunkType: "narrative",
                content: "Body",
                documentId: "doc-1",
                metadata: {
                    documentId: "doc-1",
                    sourceDocumentId: "doc-1",
                },
                pageNumber: 1,
                status: "active",
            },
        ]);
    });

    it("persists table chunks with review status", async () => {
        const { persistTableChunks } =
            await import("#/server/ingestion/persist-table-chunks");

        await persistTableChunks("doc-1", [
            {
                metadata: {
                    documentId: "doc-1",
                    sourceDocumentId: "doc-1",
                },
                pageNumber: 1,
                rowIndex: 0,
                rowText: "Pelita | SUB | 18000",
                status: "extracted",
                tableIndex: 0,
            },
        ]);

        expect(chunkQueryMock.deleteTableChunks).toHaveBeenCalledWith("doc-1");
        expect(chunkQueryMock.insertTableChunks).toHaveBeenCalledWith([
            {
                documentId: "doc-1",
                headerText: undefined,
                markdown: undefined,
                metadata: {
                    documentId: "doc-1",
                    sourceDocumentId: "doc-1",
                },
                pageNumber: 1,
                rowIndex: 0,
                rowText: "Pelita | SUB | 18000",
                status: "extracted",
                tableIndex: 0,
            },
        ]);
    });
});
