import { describe, expect, it, vi } from "vitest";

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
});
