import { describe, expect, it } from "vitest";

import { tariffSearchConditions } from "#/server/retrieval/structured-search";
import { calculateQuote } from "#/server/tariff/calculator";

import { feeRuleFixture, tariffRowFixture } from "../../unit/tariff/fixtures";

describe("retrieval and quote flow", () => {
    it("defaults structured lookup to active rows and calculates totals deterministically", () => {
        const conditions = tariffSearchConditions({
            airline: "Pelita",
            destinationCode: "SUB",
        });

        expect(conditions).toHaveLength(3);

        const quote = calculateQuote({
            feeRule: feeRuleFixture({
                adminFeePerSmu: 5000,
                dgSurcharge: null,
                id: "fee-active",
                minWeightKg: "10",
                ppnPercent: "11",
                warehouseAdminPerSmu: 2000,
                warehouseFeePerKg: 1000,
            }),
            tariffRow: tariffRowFixture({
                id: "tariff-active",
                smuPricePerKg: 18_000,
                status: "active",
            }),
            weightKg: 8,
        });

        expect(quote.billableWeightKg.toString()).toBe("10");
        expect(quote.lines[0]).toMatchObject({
            amount: "180000",
            label: "Base SMU",
            sourceId: "tariff-active",
        });
        expect(quote.total.toString()).toBe("218670");
        expect(quote.sourceIds).toContain("tariff-active");
    });
});
