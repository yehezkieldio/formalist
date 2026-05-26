import { beforeEach, describe, expect, it, vi } from "vitest";

const chunkMock = {
    searchDocumentChunks: vi.fn(() =>
        Promise.resolve([
            {
                ownerId: "chunk-1",
                ownerType: "document_chunk",
                score: 1,
                snippet: "Pelita price",
                title: "Chunk",
            },
        ])
    ),
};
const tableMock = {
    searchTableChunks: vi.fn(() => Promise.resolve([])),
};
const fullTextMock = {
    fullTextSearch: vi.fn(() =>
        Promise.resolve([
            {
                ownerId: "chunk-1",
                ownerType: "document_chunk",
                score: 1,
                snippet: "Pelita price",
                title: "Chunk",
            },
        ])
    ),
};

vi.mock("#/server/retrieval/chunk-search", () => chunkMock);
vi.mock("#/server/retrieval/table-search", () => tableMock);
vi.mock("#/server/retrieval/full-text", () => fullTextMock);

describe("hybrid search", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns fused component scores", async () => {
        const { hybridSearch } =
            await import("#/server/retrieval/hybrid-search");

        await expect(hybridSearch({ query: "pelita" })).resolves.toEqual([
            expect.objectContaining({
                componentScores: expect.objectContaining({
                    list_0: expect.any(Number),
                    list_2: expect.any(Number),
                }),
                ownerId: "chunk-1",
            }),
        ]);
    });

    it("excludes archived documents by default and opts in for history queries", async () => {
        const { hybridSearch } =
            await import("#/server/retrieval/hybrid-search");

        await hybridSearch({ query: "pelita", validOn: "2026-05-26" });
        expect(chunkMock.searchDocumentChunks).toHaveBeenLastCalledWith(
            expect.objectContaining({
                includeArchivedDocuments: false,
                validOn: "2026-05-26",
            })
        );
        expect(fullTextMock.fullTextSearch).toHaveBeenLastCalledWith(
            expect.objectContaining({
                includeArchivedDocuments: false,
                ownerTypes: ["document_chunk", "table_chunk"],
            })
        );

        await hybridSearch({ query: "historical pelita tariffs" });
        expect(chunkMock.searchDocumentChunks).toHaveBeenLastCalledWith(
            expect.objectContaining({
                includeArchivedDocuments: true,
            })
        );
    });
});
