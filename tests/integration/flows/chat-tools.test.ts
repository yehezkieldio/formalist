import { describe, expect, it } from "vitest";

import { createSetupRequiredStreamResponse } from "#/server/ai/chat-route";
import { createAssistantTools } from "#/server/ai/tools";

describe("chat tool flow", () => {
    it("exposes RAG tools and streams missing-key setup state", () => {
        const tools = createAssistantTools();

        expect(Object.keys(tools)).toContain("searchTariffs");

        const response = createSetupRequiredStreamResponse("missing key");

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("text/event");
    });
});
