import { describe, expect, it } from "vitest";

import { createBoundedExtractionPrompt } from "#/server/ingestion/extractors/cost-controls";

describe("extraction cost controls", () => {
    it("truncates oversized prompts before optional LLM extraction", () => {
        const result = createBoundedExtractionPrompt({
            label: "test",
            maxInputTokens: 100,
            prompt: "row ".repeat(2000),
        });

        expect(result.truncated).toBe(true);
        expect(result.estimatedTokens).toBeLessThanOrEqual(140);
        expect(result.prompt).toContain("prompt truncated");
    });
});
