import { describe, expect, it } from "vitest";

import { createSetupRequiredStreamResponse } from "#/server/ai/chat-route";
import { createAssistantTools } from "#/server/ai/tools";
import { verifyAnswer } from "#/server/ai/tools/verify-answer";

describe("chat tool flow", () => {
    it("exposes tools, refuses unreviewed numeric truth, and streams missing-key setup state", () => {
        const tools = createAssistantTools();

        expect(Object.keys(tools)).toContain("searchTariffs");
        expect(Object.keys(tools)).toContain("calculateQuote");

        const verification = verifyAnswer({
            mode: "verified_numeric",
            sourceCount: 1,
            trustedSourceCount: 0,
            warnings: ["Only unreviewed rows were available."],
        });

        expect(verification.confidenceState).toBe("UNVERIFIED");
        expect(verification.warnings).toContain(
            "Only unreviewed rows were available."
        );

        const response = createSetupRequiredStreamResponse("missing key");

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("text/event");
    });
});
