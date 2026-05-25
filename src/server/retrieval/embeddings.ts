import { embed } from "ai";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { AiProviderState } from "#/server/ai/provider";
import type { EmbeddingOwnerType } from "#/server/db/schema";

export interface SearchableSource {
    airline?: string | null;
    content?: string | null;
    destinationCity?: string | null;
    destinationCode?: string | null;
    factType?: string | null;
    id: string;
    pageNumber?: number | null;
    rawEvidence?: string | null;
    rawRowText?: string | null;
    routeType?: string | null;
    rowText?: string | null;
    searchableText?: string | null;
    smuPricePerKg?: number | null;
    sourceText?: string | null;
    status?: string | null;
    valueText?: string | null;
}

export function buildSearchableText(
    ownerType: EmbeddingOwnerType,
    source: SearchableSource
) {
    const parts = [
        `type:${ownerType}`,
        source.status ? `status:${source.status}` : null,
        source.pageNumber ? `page:${source.pageNumber}` : null,
        source.airline ? `airline:${source.airline}` : null,
        source.destinationCity ? `destination:${source.destinationCity}` : null,
        source.destinationCode ? `code:${source.destinationCode}` : null,
        source.routeType ? `route:${source.routeType}` : null,
        source.factType ? `fact:${source.factType}` : null,
        source.smuPricePerKg ? `price:${source.smuPricePerKg}` : null,
        source.valueText ? `value:${source.valueText}` : null,
        source.content,
        source.rowText,
        source.rawRowText,
        source.rawEvidence,
        source.sourceText,
        source.searchableText,
    ];

    return parts.filter(Boolean).join("\n");
}

export type EmbeddingClientState =
    | {
          status: "ready";
          embedText: (value: string) => Promise<number[]>;
      }
    | {
          reason: string;
          status: "setup-required";
      };

export function getEmbeddingClient(
    provider: AiProviderState = getOpenRouterProvider()
): EmbeddingClientState {
    if (provider.status === "setup-required") {
        return {
            reason: provider.reason,
            status: "setup-required",
        };
    }

    const { embeddingModel } = getModelConfiguration();

    return {
        async embedText(value: string) {
            const result = await embed({
                model: provider.openrouter.textEmbeddingModel(embeddingModel),
                value,
            });

            return result.embedding;
        },
        status: "ready",
    };
}
