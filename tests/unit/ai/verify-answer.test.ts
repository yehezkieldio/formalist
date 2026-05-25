import { describe, expect, it } from "vitest";

import { verifyAnswer } from "#/server/ai/tools/verify-answer";

describe("answer verification", () => {
    it("requires trusted sources for verified numeric answers", () => {
        expect(
            verifyAnswer({
                mode: "verified_numeric",
                sourceCount: 2,
                trustedSourceCount: 0,
            }).confidenceState
        ).toBe("UNVERIFIED");
    });

    it("marks missing sources as unanswerable and warnings as needs confirmation", () => {
        expect(
            verifyAnswer({
                mode: "general_rag",
                sourceCount: 0,
                trustedSourceCount: 0,
            }).confidenceState
        ).toBe("UNANSWERABLE");
        expect(
            verifyAnswer({
                mode: "verified_numeric",
                sourceCount: 1,
                trustedSourceCount: 1,
                warnings: ["Expired validity"],
            }).confidenceState
        ).toBe("NEEDS_CONFIRMATION");
    });
});
