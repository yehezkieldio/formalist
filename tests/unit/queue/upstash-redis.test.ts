import { describe, expect, it } from "vitest";

import { createQueueAdapter } from "#/server/queue";
import {
    createUpstashRedisQueueAdapter,
    upstashQueueFallbackMessage,
} from "#/server/queue/upstash-redis";

describe("Upstash Redis queue adapter", () => {
    it("documents that REST Redis falls back for ingestion workers", async () => {
        const adapter = createUpstashRedisQueueAdapter({
            token: "token",
            url: "https://upstash.example",
        });

        await expect(
            adapter.enqueue({
                documentId: "doc-1",
                type: "parse-document",
            })
        ).rejects.toThrow(upstashQueueFallbackMessage);
        expect(adapter.warnings).toContainEqual({
            code: "upstash-db-fallback-required",
            message: upstashQueueFallbackMessage,
        });
    });

    it("selects the DB fallback adapter when Upstash is configured", () => {
        const adapter = createQueueAdapter({
            config: {
                provider: "upstash-redis",
                upstashRestToken: "token",
                upstashRestUrl: "https://upstash.example",
            },
        });

        expect(adapter.name).toBe("db-fallback");
        expect(adapter.warnings).toContainEqual({
            code: "upstash-db-fallback-required",
            message: upstashQueueFallbackMessage,
        });
    });
});
