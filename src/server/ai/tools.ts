import * as z from "zod";

import {
    aliasInputSchema,
    ambiguityInputSchema,
    classifyIntentInputSchema,
    compareTariffsInputSchema,
    factSearchInputSchema,
    feeRuleInputSchema,
    retrievalInputSchema,
    sourceEvidenceInputSchema,
    tariffSearchInputSchema,
    verifyAnswerInputSchema,
} from "#/server/ai/tool-schemas";
import {
    calculateQuoteInputSchema,
    calculateQuoteTool,
} from "#/server/ai/tools/calculate-quote";
import { classifyIntent } from "#/server/ai/tools/classify-intent";
import { verifyAnswer } from "#/server/ai/tools/verify-answer";
import { resolveAlias } from "#/server/retrieval/aliases";
import {
    detectAliasAmbiguity,
    staticAmbiguityCandidates,
} from "#/server/retrieval/ambiguity";
import { searchDocumentChunks } from "#/server/retrieval/chunk-search";
import { compareTariffs } from "#/server/retrieval/compare-tariffs";
import { listDestinations } from "#/server/retrieval/destination-list";
import { searchFacts } from "#/server/retrieval/fact-search";
import { hybridSearch } from "#/server/retrieval/hybrid-search";
import { buildSourcePreview } from "#/server/retrieval/source-preview";
import { searchTariffs } from "#/server/retrieval/structured-search";
import { searchTableChunks } from "#/server/retrieval/table-search";
import { findApplicableFeeRule } from "#/server/tariff/fee-rules";

const listDestinationsInputSchema = z.object({
    airline: z.string().optional(),
});

export function createAssistantTools() {
    return {
        calculateQuote: {
            description:
                "Calculate deterministic air cargo quote totals from a reviewed tariff row and reviewed fee rule.",
            execute: calculateQuoteTool,
            inputSchema: calculateQuoteInputSchema,
        },
        classifyIntent: {
            description:
                "Classify whether a user request needs general RAG, verified numeric mode, quote mode, source lookup, admin status, or refusal.",
            execute: classifyIntent,
            inputSchema: classifyIntentInputSchema,
        },
        compareTariffs: {
            description:
                "Compare active reviewed tariffs and detect promo/regular ambiguity.",
            execute: (input: z.infer<typeof compareTariffsInputSchema>) =>
                compareTariffs(input, input.mode ?? "unspecified"),
            inputSchema: compareTariffsInputSchema,
        },
        flagAmbiguity: {
            description:
                "Return clarification candidates for ambiguous aliases, promo/regular, route, or date choices.",
            execute: async (input: typeof ambiguityInputSchema._zod.output) => {
                if (input.type) {
                    return await detectAliasAmbiguity({
                        query: input.query,
                        type: input.type,
                    });
                }

                return staticAmbiguityCandidates({
                    field: input.field ?? "promo",
                    query: input.query,
                });
            },
            inputSchema: ambiguityInputSchema,
        },
        getFeeRules: {
            description:
                "Find the applicable active reviewed fee rule for an airline or document.",
            execute: findApplicableFeeRule,
            inputSchema: feeRuleInputSchema,
        },
        getSourceEvidence: {
            description:
                "Fetch source evidence and document metadata for a supported citation source.",
            execute: (input: z.infer<typeof sourceEvidenceInputSchema>) =>
                buildSourcePreview(input.sourceType, input.sourceId),
            inputSchema: sourceEvidenceInputSchema,
        },
        hybridSearch: {
            description:
                "Run hybrid retrieval across document chunks, table chunks, and full-text search.",
            execute: hybridSearch,
            inputSchema: retrievalInputSchema,
        },
        listDestinations: {
            description: "List destinations from active reviewed tariff rows.",
            execute: listDestinations,
            inputSchema: listDestinationsInputSchema,
        },
        resolveAliases: {
            description:
                "Resolve fuzzy or ambiguous city, airport, airline, route, or destination aliases.",
            execute: resolveAlias,
            inputSchema: aliasInputSchema,
        },
        retrieveChunks: {
            description:
                "Retrieve semantic document chunks for general document Q&A.",
            execute: searchDocumentChunks,
            inputSchema: retrievalInputSchema,
        },
        retrieveTableChunks: {
            description:
                "Retrieve table-aware chunks for source lookup and unverified table context.",
            execute: searchTableChunks,
            inputSchema: retrievalInputSchema,
        },
        searchFacts: {
            description:
                "Search extracted facts. Use active status for trusted numeric answers.",
            execute: searchFacts,
            inputSchema: factSearchInputSchema,
        },
        searchTariffs: {
            description:
                "Search tariff rows. Defaults to active reviewed rows and is required for trusted price answers.",
            execute: searchTariffs,
            inputSchema: tariffSearchInputSchema,
        },
        verifyAnswer: {
            description:
                "Verify answer confidence from source counts, trusted source counts, and warnings.",
            execute: verifyAnswer,
            inputSchema: verifyAnswerInputSchema,
        },
    };
}

export const aiSdkToolsDecision =
    "Formalist uses AI SDK native tool calling and durable DB persistence. ai-sdk-tools.dev state/cache helpers are deferred until a concrete cache/state need appears in the route orchestration.";
