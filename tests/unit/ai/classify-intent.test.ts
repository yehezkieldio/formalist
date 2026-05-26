import { describe, expect, it } from "vitest";

import { classifyIntent } from "#/server/ai/tools/classify-intent";

describe("chat intent classification", () => {
    it("separates general RAG, verified numeric, and quote intents", async () => {
        await expect(
            classifyIntent({ query: "Ringkas isi dokumen ini" })
        ).resolves.toBe("general_rag");
        await expect(
            classifyIntent({ query: "Harga Pelita ke Surabaya berapa?" })
        ).resolves.toBe("verified_numeric");
        await expect(
            classifyIntent({
                query: "Kalau 20 kg ke Surabaya pakai Pelita total berapa?",
            })
        ).resolves.toBe("quote");
    });

    it("does not treat unrelated review language as admin workflow", async () => {
        await expect(
            classifyIntent({
                query: "What is the policy on HR performance reviews?",
            })
        ).resolves.toBe("general_rag");
        await expect(
            classifyIntent({ query: "Baris mana yang masih perlu review?" })
        ).resolves.toBe("admin_status");
    });
});
