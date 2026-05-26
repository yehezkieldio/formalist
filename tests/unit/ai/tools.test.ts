import { describe, expect, it } from "vitest";

import { aiSdkToolsDecision, createAssistantTools } from "#/server/ai/tools";

describe("assistant tool registry", () => {
    it("exposes required agentic RAG tools", () => {
        const tools = createAssistantTools();

        expect(Object.keys(tools).toSorted()).toEqual([
            "classifyIntent",
            "compareTariffs",
            "flagAmbiguity",
            "getFeeRules",
            "getSourceEvidence",
            "hybridSearch",
            "listDestinations",
            "listDocuments",
            "resolveAliases",
            "retrieveChunks",
            "retrieveTableChunks",
            "searchFacts",
            "searchTariffs",
            "verifyAnswer",
        ]);
        expect(aiSdkToolsDecision).toContain("AI SDK native tool calling");
    });
});
