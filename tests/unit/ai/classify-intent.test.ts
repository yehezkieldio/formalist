import { describe, expect, it } from "vitest";

import { classifyIntent } from "#/server/ai/tools/classify-intent";

describe("chat intent classification", () => {
    it("separates general RAG, verified numeric, and quote intents", () => {
        expect(classifyIntent({ query: "Ringkas isi dokumen ini" })).toBe(
            "general_rag"
        );
        expect(
            classifyIntent({ query: "Harga Pelita ke Surabaya berapa?" })
        ).toBe("verified_numeric");
        expect(
            classifyIntent({
                query: "Kalau 20 kg ke Surabaya pakai Pelita total berapa?",
            })
        ).toBe("quote");
    });
});
