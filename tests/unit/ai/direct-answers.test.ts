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
            airline: "Garuda / Citilink",
            destinationCode: "CGK",
        });
        expect(answer?.content).toContain(
            "Tarif aktif Garuda / Citilink ke JAKARTA tersedia"
        );
        expect(answer?.content).toContain("Rp 18.250/kg");
        expect(answer?.content).not.toContain("doc doc-1");
        expect(answer?.metadata?.tariffAnswer?.rows).toHaveLength(1);
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
            "Belum ada tarif aktif yang sudah direview untuk Garuda / Citilink ke JAKARTA."
        );
        expect(answer?.content).not.toContain("Tool results:");
    });

    it("answers destination follow-ups using previous tariff context", async () => {
        structuredSearchMock.searchTariffs.mockResolvedValueOnce([
            {
                airline: "Garuda / Citilink",
                destinationCity: "DENPASAR",
                destinationCode: "DPS",
                documentId: "doc-2",
                isPromo: false,
                originCity: null,
                pageNumber: 1,
                rawRowText: "Garuda Denpasar 23700",
                routeType: "TRANSIT",
                smuPricePerKg: 23_700,
                sourceText: "Garuda Denpasar 23700",
                transitRoute: null,
            },
        ]);
        const { getDirectChatAnswer } =
            await import("#/server/ai/chat/direct-answers");

        const answer = await getDirectChatAnswer({
            intent: "general_rag",
            messages: [
                {
                    id: "user-1",
                    parts: [
                        {
                            text: "harga tujuan jakarta dengan maskapai garuda",
                            type: "text",
                        },
                    ],
                    role: "user",
                },
                {
                    id: "assistant-1",
                    metadata: {
                        tariffAnswer: {
                            airline: "Garuda / Citilink",
                            destination: "JAKARTA",
                            rows: [],
                        },
                    },
                    parts: [
                        {
                            text: "Tarif aktif Garuda / Citilink ke JAKARTA tersedia.",
                            type: "text",
                        },
                    ],
                    role: "assistant",
                },
                {
                    id: "user-2",
                    parts: [{ text: "kalau tujuan denpasar?", type: "text" }],
                    role: "user",
                },
            ],
            mode: "general_rag",
            query: "kalau tujuan denpasar?",
        });

        expect(structuredSearchMock.searchTariffs).toHaveBeenCalledWith({
            airline: "Garuda / Citilink",
            destinationCode: "DPS",
        });
        expect(answer?.content).toContain(
            "Tarif aktif Garuda / Citilink ke DENPASAR tersedia"
        );
        expect(answer?.content).not.toContain("Let me");
        expect(answer?.content).not.toContain("Tool results:");
    });

    it("compares the last two tariff answers from persisted chat metadata", async () => {
        const { getDirectChatAnswer } =
            await import("#/server/ai/chat/direct-answers");

        const answer = await getDirectChatAnswer({
            intent: "verified_numeric",
            messages: [
                {
                    id: "user-1",
                    parts: [
                        {
                            text: "harga tujuan denpasar dengan maskapai garuda?",
                            type: "text",
                        },
                    ],
                    role: "user",
                },
                {
                    id: "assistant-1",
                    metadata: {
                        tariffAnswer: {
                            airline: "Garuda / Citilink",
                            destination: "DENPASAR",
                            rows: [
                                {
                                    documentId: "doc-denpasar-1",
                                    isPromo: false,
                                    routeType: "TRANSIT via CGK",
                                    smuPricePerKg: 23_700,
                                },
                                {
                                    documentId: "doc-denpasar-2",
                                    isPromo: false,
                                    routeType: "TRANSIT via CGK",
                                    smuPricePerKg: 24_950,
                                },
                            ],
                        },
                    },
                    parts: [
                        {
                            text: "Tarif aktif Garuda / Citilink ke DENPASAR tersedia dari Rp 23.700/kg sampai Rp 24.950/kg.",
                            type: "text",
                        },
                    ],
                    role: "assistant",
                },
                {
                    id: "user-2",
                    parts: [{ text: "alau jakarta?", type: "text" }],
                    role: "user",
                },
                {
                    id: "assistant-2",
                    metadata: {
                        tariffAnswer: {
                            airline: "Garuda / Citilink",
                            destination: "JAKARTA",
                            rows: [
                                {
                                    documentId: "doc-jakarta-1",
                                    isPromo: false,
                                    routeType: "DIRECT",
                                    smuPricePerKg: 17_300,
                                },
                                {
                                    documentId: "doc-jakarta-2",
                                    isPromo: false,
                                    routeType: "DIRECT",
                                    smuPricePerKg: 18_250,
                                },
                            ],
                        },
                    },
                    parts: [
                        {
                            text: "Tarif aktif Garuda / Citilink ke JAKARTA tersedia dari Rp 17.300/kg sampai Rp 18.250/kg.",
                            type: "text",
                        },
                    ],
                    role: "assistant",
                },
                {
                    id: "user-3",
                    parts: [
                        {
                            text: "itu selisih berapa meraka dua?",
                            type: "text",
                        },
                    ],
                    role: "user",
                },
            ],
            mode: "verified_numeric",
            query: "itu selisih berapa meraka dua?",
        });

        expect(structuredSearchMock.searchTariffs).not.toHaveBeenCalled();
        expect(answer?.content).toContain("DENPASAR dan JAKARTA");
        expect(answer?.content).toContain("Rp 6.400/kg");
        expect(answer?.content).toContain("Rp 6.700/kg");
        expect(answer?.content).not.toContain("Tool results:");
    });
});
