import { describe, expect, it, vi } from "vitest";

const aliasMock = {
    resolveAlias: vi.fn(),
};

vi.mock("#/server/retrieval/aliases", () => aliasMock);

describe("ambiguity helpers", () => {
    it("returns alias clarification candidates when a query is ambiguous", async () => {
        aliasMock.resolveAlias.mockResolvedValue({
            candidates: [
                {
                    alias: "jog",
                    canonicalValue: "JOG",
                    metadata: { city: "Yogyakarta" },
                    type: "airport",
                },
                {
                    alias: "yia",
                    canonicalValue: "YIA",
                    metadata: { city: "Yogyakarta" },
                    type: "airport",
                },
            ],
            isAmbiguous: true,
        });
        const { detectAliasAmbiguity } =
            await import("#/server/retrieval/ambiguity");

        await expect(
            detectAliasAmbiguity({ query: "Jogja", type: "airport" })
        ).resolves.toEqual([
            expect.objectContaining({ canonicalValue: "JOG" }),
            expect.objectContaining({ canonicalValue: "YIA" }),
        ]);
    });

    it("returns static promo, route, and date clarification candidates", async () => {
        const { staticAmbiguityCandidates } =
            await import("#/server/retrieval/ambiguity");

        expect(
            staticAmbiguityCandidates({ field: "promo", query: "harga jogja" })
        ).toHaveLength(2);
        expect(
            staticAmbiguityCandidates({ field: "route", query: "direct" })
        ).toHaveLength(2);
        expect(
            staticAmbiguityCandidates({ field: "date", query: "latest" })
        ).toHaveLength(2);
    });
});
