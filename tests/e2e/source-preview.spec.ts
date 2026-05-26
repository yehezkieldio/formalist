import { describe, expect, it, vi } from "vitest";

import { buildSourcePreview } from "#/server/retrieval/source-preview";

describe("source preview API support", () => {
    it("builds source preview evidence with document metadata", async () => {
        const preview = await buildSourcePreview(
            "tariff_row",
            "11111111-1111-4111-8111-111111111111",
            {
                getDocument: vi.fn().mockResolvedValue({
                    filename: "pelita.pdf",
                    id: "22222222-2222-4222-8222-222222222222",
                    sourceName: "Pelita active pricelist",
                }),
                getSourceEvidence: vi.fn().mockResolvedValue({
                    documentId: "22222222-2222-4222-8222-222222222222",
                    pageNumber: 2,
                    snippet: "SUB CGK 18000",
                    source: {
                        airline: "Pelita",
                        destinationCode: "SUB",
                        smuPricePerKg: 18_000,
                    },
                    sourceType: "tariff_row",
                }),
            }
        );

        expect(preview).toEqual({
            document: {
                filename: "pelita.pdf",
                id: "22222222-2222-4222-8222-222222222222",
                sourceName: "Pelita active pricelist",
            },
            evidence: {
                documentId: "22222222-2222-4222-8222-222222222222",
                pageNumber: 2,
                snippet: "SUB CGK 18000",
                source: {
                    airline: "Pelita",
                    destinationCode: "SUB",
                    smuPricePerKg: 18_000,
                },
                sourceType: "tariff_row",
            },
        });
    });

    it("returns null when source evidence is missing", async () => {
        const preview = await buildSourcePreview(
            "tariff_row",
            "11111111-1111-4111-8111-111111111111",
            {
                getSourceEvidence: vi.fn().mockResolvedValue(null),
            }
        );

        expect(preview).toBeNull();
    });
});
