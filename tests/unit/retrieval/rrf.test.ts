import { describe, expect, it } from "vitest";

import { reciprocalRankFusion } from "#/server/retrieval/rrf";

describe("reciprocal rank fusion", () => {
    it("combines ranks deterministically with weights", () => {
        const results = reciprocalRankFusion(
            [
                [
                    {
                        ownerId: "a",
                        ownerType: "document_chunk",
                        score: 1,
                        snippet: "A",
                        title: "A",
                    },
                ],
                [
                    {
                        ownerId: "a",
                        ownerType: "document_chunk",
                        score: 1,
                        snippet: "A",
                        title: "A",
                    },
                    {
                        ownerId: "b",
                        ownerType: "table_chunk",
                        score: 1,
                        snippet: "B",
                        title: "B",
                    },
                ],
            ],
            { weights: [1, 2] }
        );

        expect(results[0]?.ownerId).toBe("a");
        expect(results[0]?.componentScores).toHaveProperty("list_0");
        expect(results[0]?.componentScores).toHaveProperty("list_1");
    });
});
