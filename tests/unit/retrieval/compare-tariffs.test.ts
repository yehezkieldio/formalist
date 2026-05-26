import { describe, expect, it, vi } from "vitest";

const structuredMock = {
    searchTariffs: vi.fn(),
};

vi.mock("#/server/retrieval/structured-search", () => structuredMock);

describe("compare tariffs", () => {
    it("flags promo/regular ambiguity when underspecified", async () => {
        structuredMock.searchTariffs.mockResolvedValue([
            { isPromo: true, smuPricePerKg: 20_000, validFrom: "2026-05-01" },
            { isPromo: false, smuPricePerKg: 18_000, validFrom: "2026-05-01" },
        ]);
        const { compareTariffs } =
            await import("#/server/retrieval/compare-tariffs");

        await expect(compareTariffs({})).resolves.toMatchObject({
            ambiguity: "promo_regular",
        });
    });

    it("sorts cheapest rows", async () => {
        structuredMock.searchTariffs.mockResolvedValue([
            { isPromo: false, smuPricePerKg: 20_000, validFrom: "2026-05-01" },
            { isPromo: false, smuPricePerKg: 18_000, validFrom: "2026-05-01" },
        ]);
        const { compareTariffs } =
            await import("#/server/retrieval/compare-tariffs");
        const result = await compareTariffs({}, "cheapest");

        expect(result.rows[0]?.smuPricePerKg).toBe(18_000);
    });
});
