import { describe, expect, it } from "vitest";

import { buildToolResultFallback } from "#/server/ai/chat/final-answer-guard";
import type { AssistantToolEvent } from "#/server/ai/tools";

describe("final answer repair fallback", () => {
    it("formats tariff rows as a readable answer instead of dumping raw tool output", () => {
        const fallback = buildToolResultFallback([
            {
                input: { query: "harga jakarta maskapai garuda" },
                output: "verified_numeric",
                state: "success",
                toolName: "classifyIntent",
            },
            {
                input: { query: "Garuda" },
                output: {
                    candidates: [],
                    confidence: 0,
                    isAmbiguous: false,
                    resolved: null,
                },
                state: "success",
                toolName: "resolveAliases",
            },
            {
                input: { airline: "Garuda", destinationCity: "Jakarta" },
                output: [
                    {
                        airline: "Garuda",
                        destinationCity: "JAKARTA",
                        isPromo: false,
                        originCity: "SURABAYA",
                        routeType: "DIRECT",
                        smuPricePerKg: 18_250,
                    },
                    {
                        airline: "Garuda",
                        destinationCity: "JAKARTA",
                        isPromo: true,
                        originCity: "SURABAYA",
                        routeType: "DIRECT",
                        smuPricePerKg: 17_300,
                    },
                ],
                state: "success",
                toolName: "searchTariffs",
            },
        ] satisfies AssistantToolEvent[]);

        expect(fallback).toContain("Tarif aktif ke JAKARTA untuk Garuda:");
        expect(fallback).toContain("Rp 17.300 /kg");
        expect(fallback).toContain("Rp 18.250 /kg");
        expect(fallback).not.toContain("Tool results:");
        expect(fallback).not.toContain("resolveAliases");
        expect(fallback).not.toContain("result");
    });

    it("does not promote generic tool output into answer text", () => {
        const fallback = buildToolResultFallback([
            {
                input: { query: "documents" },
                output: {
                    items: [
                        { filename: "tariff.pdf" },
                        { filename: "fees.pdf" },
                    ],
                },
                state: "success",
                toolName: "listDocuments",
            },
        ] satisfies AssistantToolEvent[]);

        expect(fallback).toContain(
            "tidak akan menampilkan payload tool mentah"
        );
        expect(fallback).not.toContain("listDocuments:");
        expect(fallback).not.toContain("Returned 2 results.");
        expect(fallback).not.toContain("Tool results:");
        expect(fallback).not.toContain("{");
        expect(fallback).not.toContain("}");
        expect(fallback).not.toContain('"items"');
    });
});
