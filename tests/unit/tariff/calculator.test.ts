import { describe, expect, it } from "vitest";

import { calculateQuote } from "#/server/tariff/calculator";

import { feeRuleFixture, tariffRowFixture } from "./fixtures";

describe("quote calculator", () => {
    it("uses min weight, fees, surcharge, PPN, and source IDs", () => {
        const expectedBase = String(200_000);
        const expectedFee = String(10_000);
        const result = calculateQuote({
            feeRule: feeRuleFixture({
                adminFeePerSmu: 10_000,
                dgSurcharge: 5000,
                minWeightKg: "10",
                ppnPercent: "11",
                warehouseAdminPerSmu: 2000,
                warehouseFeePerKg: 1000,
            }),
            tariffRow: tariffRowFixture({ smuPricePerKg: 20_000 }),
            weightKg: 5,
        });

        expect(result.billableWeightKg).toBe("10");
        expect(result.lines).toEqual([
            expect.objectContaining({
                amount: expectedBase,
                label: "Base SMU",
            }),
            expect.objectContaining({
                amount: expectedFee,
                label: "Airline admin",
            }),
            expect.objectContaining({
                amount: expectedFee,
                label: "Warehouse fee",
            }),
            expect.objectContaining({
                amount: "2000",
                label: "Warehouse admin",
            }),
            expect.objectContaining({ amount: "5000", label: "Surcharge" }),
            expect.objectContaining({ amount: "24970", label: "PPN" }),
        ]);
        expect(result.total).toBe("251970");
        expect(result.sourceIds).toEqual(["row-1", "fee-1"]);
    });

    it("warns when fee rules are missing", () => {
        const result = calculateQuote({
            feeRule: null,
            tariffRow: tariffRowFixture({ smuPricePerKg: 20_000 }),
            weightKg: 5,
        });

        expect(result.total).toBe("100000");
        expect(result.warnings).toContain(
            "Fee rule is missing; fee lines defaulted to zero."
        );
    });
});
