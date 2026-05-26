import { beforeEach, describe, expect, it, vi } from "vitest";

const aliasesQueryMock = {
    findAliasesByType: vi.fn(() => Promise.resolve([])),
};
const documentListMock = {
    listDocumentInventory: vi.fn(() => Promise.resolve([])),
};
const structuredSearchMock = {
    searchTariffs: vi.fn<(_input: unknown) => Promise<unknown[]>>(() =>
        Promise.resolve([])
    ),
};

vi.mock("#/server/db/queries/aliases", () => aliasesQueryMock);
vi.mock("#/server/retrieval/document-list", () => documentListMock);
vi.mock("#/server/retrieval/structured-search", () => structuredSearchMock);

describe("direct chat answers", () => {
    beforeEach(() => {
        aliasesQueryMock.findAliasesByType.mockClear();
        documentListMock.listDocumentInventory.mockClear();
        structuredSearchMock.searchTariffs.mockReset();
        structuredSearchMock.searchTariffs.mockResolvedValue([]);
    });

    it("routes Garuda Jakarta price questions to structured tariff lookup", async () => {
        structuredSearchMock.searchTariffs.mockResolvedValueOnce([
            {
                airline: "Garuda",
                destinationCity: "JAKARTA",
                destinationCode: "CGK",
                documentId: "doc-1",
                isPromo: false,
                originCity: "BALIKPAPAN",
                pageNumber: 3,
                rawRowText: "Garuda Jakarta 18250",
                routeType: "DIRECT",
                smuPricePerKg: 18_250,
                sourceText: "Garuda Jakarta 18250",
            },
        ]);
        const { getDirectChatAnswer } =
            await import("#/server/ai/chat/direct-answers");

        const answer = await getDirectChatAnswer({
            intent: "verified_numeric",
            messages: [],
            mode: "verified_numeric",
            query: "harga jakarta untuk maskapai garuda",
        });

        expect(structuredSearchMock.searchTariffs).toHaveBeenCalledWith({
            airline: "Garuda",
            destinationCode: "CGK",
        });
        expect(answer?.content).toContain(
            "Tarif aktif ke JAKARTA untuk Garuda:"
        );
        expect(answer?.content).toContain("Rp 18.250/kg");
        expect(answer?.content).not.toContain("Tool results:");
    });

    it("returns a trusted no-data answer instead of falling through to generic RAG", async () => {
        const { getDirectChatAnswer } =
            await import("#/server/ai/chat/direct-answers");

        const answer = await getDirectChatAnswer({
            intent: "verified_numeric",
            messages: [],
            mode: "verified_numeric",
            query: "harga jakarta untuk maskapai garuda",
        });

        expect(answer?.content).toBe(
            "Belum ada tarif aktif yang sudah direview untuk Garuda ke JAKARTA."
        );
        expect(answer?.content).not.toContain("Tool results:");
    });
});
