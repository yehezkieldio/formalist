import { describe, expect, it } from "vitest";

import {
    buildRepairEvidence,
    buildToolResultFallbackMetadata,
    needsFinalAnswerRepair,
} from "#/server/ai/chat/final-answer-guard";
import type { AssistantToolEvent } from "#/server/ai/tools";

describe("final answer guard", () => {
    it("detects planning narration after tool use as repairable", () => {
        expect(
            needsFinalAnswerRepair({
                text: "Let me search the documents first.",
                toolEvents: [
                    {
                        input: { query: "harga balikpapan ambon garuda" },
                        output: [],
                        state: "success",
                        toolName: "searchTariffs",
                    },
                ],
            })
        ).toBe(true);
    });

    it("builds compact repair evidence without raw payload dumping", () => {
        const evidence = buildRepairEvidence({
            originalAnswer: "Let me check more sources.",
            query: "harga balikpapan ke ambon dengan garuda",
            toolEvents: [
                {
                    input: { query: "AMBON Garuda Balikpapan" },
                    output: [
                        {
                            airline: "Garuda/Citilink",
                            destinationCity: "AMBON",
                            destinationCode: "AMQ",
                            ignoredNestedBlob: "x".repeat(2000),
                            originCity: "BALIKPAPAN",
                            rawRowText:
                                "Garuda/Citilink | AMBON | AMQ | TRANSIT | CGK | Rp 62.800",
                            routeType: "TRANSIT",
                            smuPricePerKg: 62_800,
                            transitRoute: "CGK",
                        },
                    ],
                    state: "success",
                    toolName: "hybridSearch",
                },
            ] satisfies AssistantToolEvent[],
        });

        expect(JSON.stringify(evidence)).toContain("Rp 62.800");
        expect(JSON.stringify(evidence)).toContain("BALIKPAPAN");
        expect(JSON.stringify(evidence)).not.toContain("ignoredNestedBlob");
        expect(JSON.stringify(evidence).length).toBeLessThan(2000);
    });

    it("still builds tariff answer metadata for structured tariff rows", () => {
        const metadata = buildToolResultFallbackMetadata([
            {
                input: { airline: "Garuda", destinationCity: "Ambon" },
                output: [
                    {
                        airline: "Garuda",
                        destinationCity: "AMBON",
                        destinationCode: "AMQ",
                        documentId: "doc-1",
                        isPromo: false,
                        originCity: "BALIKPAPAN",
                        routeType: "TRANSIT",
                        smuPricePerKg: 62_800,
                        transitRoute: "CGK",
                    },
                ],
                state: "success",
                toolName: "searchTariffs",
            },
        ] satisfies AssistantToolEvent[]);

        expect(metadata?.tariffAnswer?.rows[0]).toMatchObject({
            destinationCode: "AMQ",
            originCity: "BALIKPAPAN",
            routeType: "TRANSIT via CGK",
            smuPricePerKg: 62_800,
        });
    });
});
