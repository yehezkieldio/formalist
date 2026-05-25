import { describe, expect, it } from "vitest";

import { createSetupRequiredStreamResponse } from "#/server/ai/chat-route";

describe("AI chat route support", () => {
    it("returns a setup-required UI stream without throwing", () => {
        const response = createSetupRequiredStreamResponse(
            "OPENROUTER_API_KEY is not configured."
        );

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain(
            "text/event-stream"
        );
    });
});
