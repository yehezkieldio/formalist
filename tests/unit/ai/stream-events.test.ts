import { describe, expect, it } from "vitest";

import {
    collectSourceIds,
    redactSecrets,
    serializeToolCallForStream,
} from "#/server/ai/stream-events";

describe("AI stream event serializers", () => {
    it("redacts nested secrets without dropping source identifiers", () => {
        const serialized = serializeToolCallForStream({
            input: {
                authorization: "Bearer secret",
                filters: { sourceId: "source-1" },
            },
            output: {
                results: [
                    {
                        price: 18_000,
                        source_id: "source-2",
                    },
                ],
                token: "private",
            },
            toolName: "searchTariffs",
        });

        expect(serialized.input).toEqual({
            authorization: "[REDACTED]",
            filters: { sourceId: "source-1" },
        });
        expect(serialized.output).toEqual({
            results: [{ price: 18_000, source_id: "source-2" }],
            token: "[REDACTED]",
        });
        expect(serialized.sourceIds).toEqual(["source-1", "source-2"]);
        expect(serialized.summary).toBe("searchTariffs returned 1 result");
    });

    it("handles arrays and non-object values", () => {
        expect(redactSecrets([{ apiKey: "secret" }, "ok"])).toEqual([
            { apiKey: "[REDACTED]" },
            "ok",
        ]);
        expect(collectSourceIds(null)).toEqual([]);
    });
});
