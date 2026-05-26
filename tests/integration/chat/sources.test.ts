import { describe, expect, it } from "vitest";

import { chatSourceService } from "#/server/chat/sources";

describe("chat sources", () => {
    it("exposes source attach helper", () => {
        expect(chatSourceService.attach).toBeTypeOf("function");
    });
});
