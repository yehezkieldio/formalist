import { describe, expect, it } from "vitest";

import {
    buildSearchableText,
    getEmbeddingClient,
} from "#/server/retrieval/embeddings";

describe("embeddings", () => {
    it("builds source-rich searchable text for supported owner types", () => {
        expect(
            buildSearchableText("tariff_row", {
                airline: "Pelita Air",
                destinationCity: "Surabaya",
                destinationCode: "SUB",
                id: "row-1",
                rawRowText: "Pelita | SUB | 18000",
                routeType: "DIRECT",
                smuPricePerKg: 18_000,
                status: "active",
            })
        ).toContain("airline:Pelita Air");
        expect(
            buildSearchableText("document_chunk", {
                content: "PPN 11% applies to all shipments",
                id: "chunk-1",
                pageNumber: 2,
            })
        ).toContain("PPN 11%");
    });

    it("returns setup-required when OpenRouter key is missing", () => {
        expect(
            getEmbeddingClient({
                reason: "OPENROUTER_API_KEY is not configured.",
                status: "setup-required",
            })
        ).toMatchObject({ status: "setup-required" });
    });
});
