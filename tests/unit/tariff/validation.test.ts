import { describe, expect, it } from "vitest";

import { classifyReviewStatus } from "#/server/tariff/status";
import { validateQuoteInputs } from "#/server/tariff/validation";

describe("tariff validation", () => {
    it("classifies active, expired, unreviewed, and missing rows", () => {
        expect(classifyReviewStatus({ status: "active" })).toBe("active");
        expect(classifyReviewStatus({ status: "extracted" })).toBe(
            "unreviewed"
        );
        expect(classifyReviewStatus({})).toBe("missing");
        expect(
            classifyReviewStatus({
                now: new Date("2026-05-25T00:00:00Z"),
                status: "active",
                validUntil: "2026-05-01",
            })
        ).toBe("expired");
    });

    it("returns quote warnings for invalid inputs", () => {
        expect(
            validateQuoteInputs({
                smuPricePerKg: null,
                status: "extracted",
                weightKg: 0,
            }).warnings
        ).toEqual([
            "Tariff row is unreviewed.",
            "Tariff row is missing SMU price.",
            "Weight must be greater than zero.",
        ]);
    });
});
