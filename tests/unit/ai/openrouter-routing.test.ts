import { describe, expect, it } from "vitest";

import { buildOpenRouterProviderRouting } from "#/server/ai/openrouter-routing";

describe("OpenRouter provider routing", () => {
    it("defaults to price-first routing with fallbacks enabled", () => {
        expect(
            buildOpenRouterProviderRouting({
                allowFallbacks: true,
                requireParameters: false,
                sort: "price",
            })
        ).toMatchObject({
            allow_fallbacks: true,
            require_parameters: false,
            sort: "price",
        });
    });

    it("parses provider restrictions and price caps", () => {
        expect(
            buildOpenRouterProviderRouting({
                allowFallbacks: false,
                dataCollection: "deny",
                ignoredProviders: "expensive-a,slow-b",
                maxCompletionPrice: "0.2",
                maxPromptPrice: "0.1",
                onlyProviders: "deepinfra,fireworks",
                providerOrder: "deepinfra, fireworks",
                requireParameters: true,
                sort: "throughput",
            })
        ).toEqual({
            allow_fallbacks: false,
            data_collection: "deny",
            ignore: ["expensive-a", "slow-b"],
            max_price: {
                completion: "0.2",
                prompt: "0.1",
            },
            only: ["deepinfra", "fireworks"],
            order: ["deepinfra", "fireworks"],
            require_parameters: true,
            sort: "throughput",
        });
    });
});
