import { describe, expect, it } from "vitest";

import { vectorToSqlLiteral } from "#/server/retrieval/vector-search";

describe("vector search", () => {
    it("formats vectors for pgvector query bindings", () => {
        expect(vectorToSqlLiteral([0.1, 0.2, 0.3])).toBe("[0.1,0.2,0.3]");
    });
});
