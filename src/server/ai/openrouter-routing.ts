import type {
    OpenRouterChatSettings,
    OpenRouterEmbeddingSettings,
} from "@openrouter/ai-sdk-provider";

import { env } from "#/env";

const splitCsv = (value: string | undefined) =>
    (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

type ProviderRouting = NonNullable<OpenRouterChatSettings["provider"]>;

interface ProviderRoutingInput {
    allowFallbacks: boolean;
    dataCollection?: "allow" | "deny";
    ignoredProviders?: string;
    maxCompletionPrice?: string;
    maxPromptPrice?: string;
    onlyProviders?: string;
    providerOrder?: string;
    requireParameters: boolean;
    sort: "latency" | "price" | "throughput";
}

export function buildOpenRouterProviderRouting(
    input: ProviderRoutingInput
): ProviderRouting {
    const providerOrder = splitCsv(input.providerOrder);
    const onlyProviders = splitCsv(input.onlyProviders);
    const ignoredProviders = splitCsv(input.ignoredProviders);
    const maxPrice: NonNullable<ProviderRouting["max_price"]> = {};

    if (input.maxPromptPrice) {
        maxPrice.prompt = input.maxPromptPrice;
    }

    if (input.maxCompletionPrice) {
        maxPrice.completion = input.maxCompletionPrice;
    }

    return {
        allow_fallbacks: input.allowFallbacks,
        ...(input.dataCollection
            ? { data_collection: input.dataCollection }
            : {}),
        ...(ignoredProviders.length > 0 ? { ignore: ignoredProviders } : {}),
        ...(Object.keys(maxPrice).length > 0 ? { max_price: maxPrice } : {}),
        ...(onlyProviders.length > 0 ? { only: onlyProviders } : {}),
        ...(providerOrder.length > 0 ? { order: providerOrder } : {}),
        require_parameters: input.requireParameters,
        sort: input.sort,
    };
}

export function getOpenRouterProviderRouting(): ProviderRouting {
    return buildOpenRouterProviderRouting({
        allowFallbacks: env.OPENROUTER_ALLOW_FALLBACKS,
        dataCollection: env.OPENROUTER_DATA_COLLECTION,
        ignoredProviders: env.OPENROUTER_IGNORE_PROVIDERS,
        maxCompletionPrice: env.OPENROUTER_MAX_COMPLETION_PRICE,
        maxPromptPrice: env.OPENROUTER_MAX_PROMPT_PRICE,
        onlyProviders: env.OPENROUTER_ONLY_PROVIDERS,
        providerOrder: env.OPENROUTER_PROVIDER_ORDER,
        requireParameters: env.OPENROUTER_REQUIRE_PARAMETERS,
        sort: env.OPENROUTER_PROVIDER_SORT,
    });
}

export function getOpenRouterChatSettings(): OpenRouterChatSettings {
    return {
        provider: getOpenRouterProviderRouting(),
    };
}

export function getOpenRouterEmbeddingSettings(): OpenRouterEmbeddingSettings {
    return {
        provider: getOpenRouterProviderRouting() as NonNullable<
            OpenRouterEmbeddingSettings["provider"]
        >,
    };
}
