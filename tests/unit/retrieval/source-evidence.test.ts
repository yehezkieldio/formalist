import { describe, expect, it } from "vitest";

describe("source evidence", () => {
    it("exports tariff evidence lookup from the tariff boundary", async () => {
        const retrieval = await import("#/server/retrieval/source-evidence");
        const tariff = await import("#/server/tariff/evidence");

        expect(tariff.getSourceEvidence).toBe(retrieval.getSourceEvidence);
    });
});
