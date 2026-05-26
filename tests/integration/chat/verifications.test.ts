import { describe, expect, it } from "vitest";

import { answerVerificationService } from "#/server/chat/verifications";

describe("answer verifications", () => {
    it("exposes verification persistence helper", () => {
        expect(answerVerificationService.create).toBeTypeOf("function");
    });
});
