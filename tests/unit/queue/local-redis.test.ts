import { describe, expect, it } from "vitest";

import {
    buildBullMqJobOptions,
    ingestionQueueName,
} from "#/server/queue/local-redis";

describe("local Redis queue adapter", () => {
    it("uses the Formalist ingestion queue name", () => {
        expect(ingestionQueueName).toBe("formalist-ingestion");
    });

    it("builds BullMQ retry options with exponential backoff", () => {
        const options = buildBullMqJobOptions({
            documentId: "doc-1",
            maxAttempts: 5,
            type: "parse-document",
        });

        expect(options).toMatchObject({
            attempts: 5,
            backoff: {
                delay: 1000,
                jitter: 0.25,
                type: "exponential",
            },
            removeOnComplete: 100,
            removeOnFail: 500,
        });
    });
});
