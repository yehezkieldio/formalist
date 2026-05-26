import { describe, expect, it } from "vitest";

import { formalistSystemPrompt } from "#/server/ai/system-prompt";

describe("formalist system prompt", () => {
    it("defines Raihan identity and Formalist Engine runtime", () => {
        expect(formalistSystemPrompt).toContain("Raihan Pratama Putra");
        expect(formalistSystemPrompt).toContain("called Raihan");
        expect(formalistSystemPrompt).toContain("Formalist Engine");
    });

    it("keeps language, tone, and reasoning boundaries explicit", () => {
        expect(formalistSystemPrompt).toContain("Default to Bahasa Indonesia");
        expect(formalistSystemPrompt).toContain("Do not use emojis");
        expect(formalistSystemPrompt).toContain(
            "Do not reveal private chain-of-thought"
        );
    });

    it("requires tool-grounded numeric answers", () => {
        expect(formalistSystemPrompt).toContain(
            "Call tools before answering any price"
        );
        expect(formalistSystemPrompt).toContain(
            "Answer from available tariff rows"
        );
    });

    it("prevents raw tool payloads from leaking into final responses", () => {
        expect(formalistSystemPrompt).toContain(
            "Do not paste raw JSON, raw tool payloads, or long extracted blobs"
        );
    });
});
