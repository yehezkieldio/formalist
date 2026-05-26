import { describe, expect, it } from "vitest";

import { formatQuoteLines } from "#/server/tariff/formatting";

describe("quote formatting", () => {
    it("formats quote result without doing math", () => {
        expect(
            formatQuoteLines({
                billableWeightKg: "10",
                lines: [{ amount: "200000", label: "Base SMU" }],
                sourceIds: ["row-1"],
                total: "200000",
                warnings: ["Needs review"],
            })
        ).toEqual([
            "Billable weight: 10 kg",
            "Base SMU: IDR 200000",
            "Total: IDR 200000",
            "Warning: Needs review",
        ]);
    });
});
