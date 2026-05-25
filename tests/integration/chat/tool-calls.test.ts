import { describe, expect, it } from "vitest";

import { chatToolCallService } from "#/server/chat/tool-calls";

describe("chat tool calls", () => {
    it("exposes create and update state helpers", () => {
        expect(chatToolCallService.create).toBeTypeOf("function");
        expect(chatToolCallService.updateState).toBeTypeOf("function");
    });
});
