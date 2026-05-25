import { describe, expect, it } from "vitest";

import { createMessageSchema } from "#/app/api/chat/sessions/schema";

describe("chat messages", () => {
    it("validates persisted message roles and parts", () => {
        expect(
            createMessageSchema.parse({
                content: "Hello",
                parts: [{ text: "Hello", type: "text" }],
                role: "user",
            })
        ).toMatchObject({ role: "user" });
        expect(() =>
            createMessageSchema.parse({ content: "x", role: "admin" })
        ).toThrow();
    });
});
