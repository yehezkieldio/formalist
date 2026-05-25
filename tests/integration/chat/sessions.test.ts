import { describe, expect, it } from "vitest";

import { fallbackChatTitle } from "#/server/chat/title-generation";

describe("chat sessions", () => {
    it("creates deterministic fallback titles", () => {
        expect(
            fallbackChatTitle("  Harga Pelita ke Surabaya berapa hari ini?  ")
        ).toBe("Harga Pelita ke Surabaya berapa hari ini?");
        expect(fallbackChatTitle("")).toBe("New chat");
    });
});
