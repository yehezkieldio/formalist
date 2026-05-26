import { describe, expect, it } from "vitest";

describe("fee rule lookup", () => {
    it("exports applicable fee lookup service", async () => {
        const feeRuleModule = await import("#/server/tariff/fee-rules");

        expect(feeRuleModule.findApplicableFeeRule).toBeTypeOf("function");
    });
});
