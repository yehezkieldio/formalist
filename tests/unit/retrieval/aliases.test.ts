import { describe, expect, it } from "vitest";

import { resolveAliasFromRecords } from "#/server/retrieval/aliases";
import { builtInAliases } from "#/server/retrieval/built-in-aliases";

describe("alias resolution", () => {
    it("resolves exact aliases before fuzzy matches", () => {
        expect(
            resolveAliasFromRecords({
                query: "sub",
                records: builtInAliases,
            })
        ).toMatchObject({
            confidence: 1,
            isAmbiguous: false,
            resolved: {
                canonicalValue: "SUB",
            },
        });
    });

    it("returns ambiguity for Jogja/YIA/JOG aliases", () => {
        expect(
            resolveAliasFromRecords({
                query: "jogja",
                records: builtInAliases,
            })
        ).toMatchObject({
            isAmbiguous: true,
            resolved: {
                canonicalValue: "Yogyakarta",
            },
        });
    });

    it("uses fuzzy matching for near aliases", () => {
        expect(
            resolveAliasFromRecords({
                query: "pelitaa",
                records: builtInAliases,
            }).candidates[0]
        ).toMatchObject({
            canonicalValue: "Pelita Air",
        });
    });
});
