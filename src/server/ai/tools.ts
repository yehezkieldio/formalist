import * as z from "zod";

import {
    aliasInputSchema,
    ambiguityInputSchema,
    classifyIntentInputSchema,
    compareTariffsInputSchema,
    documentListInputSchema,
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
import { chatToolCallService } from "#/server/chat/tool-calls";
import { resolveAlias } from "#/server/retrieval/aliases";
import {
    detectAliasAmbiguity,
    staticAmbiguityCandidates,
} from "#/server/retrieval/ambiguity";
import { searchDocumentChunks } from "#/server/retrieval/chunk-search";
import { compareTariffs } from "#/server/retrieval/compare-tariffs";
import { listDestinations } from "#/server/retrieval/destination-list";
import { listDocumentInventory } from "#/server/retrieval/document-list";
import { searchFacts } from "#/server/retrieval/fact-search";
import { hybridSearch } from "#/server/retrieval/hybrid-search";
import { buildSourcePreview } from "#/server/retrieval/source-preview";
import { searchTariffs } from "#/server/retrieval/structured-search";
import { searchTableChunks } from "#/server/retrieval/table-search";
import { findApplicableFeeRule } from "#/server/tariff/fee-rules";

const listDestinationsInputSchema = z.object({
    airline: z.string().optional(),
});

export type AssistantToolEvent =
    | {
          state: "running";
          toolName: string;
      }
    | {
          error?: string;
          state: "error" | "success";
          toolName: string;
      };

interface AssistantToolOptions {
    onToolEvent?: (event: AssistantToolEvent) => void;
    sessionId?: string;
}

function createTrackedExecute<Input, Output>(
    toolName: string,
    execute: (input: Input) => Output | Promise<Output>,
    options: AssistantToolOptions
) {
    return async (input: Input) => {
        options.onToolEvent?.({ state: "running", toolName });

        if (!options.sessionId) {
            try {
                const output = await execute(input);
                options.onToolEvent?.({ state: "success", toolName });
                return output;
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Tool call failed.";
                options.onToolEvent?.({
                    error: message,
                    state: "error",
                    toolName,
                });
                throw error;
            }
        }

        const toolCall = await chatToolCallService.create({
            input,
            sessionId: options.sessionId,
            state: "running",
            toolName,
        });

        try {
            const output = await execute(input);
            await chatToolCallService.updateState(
                toolCall.id,
                "success",
                output
            );
            options.onToolEvent?.({ state: "success", toolName });
            return output;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Tool call failed.";
            await chatToolCallService.updateState(
                toolCall.id,
                "error",
                undefined,
                message
            );
            options.onToolEvent?.({ error: message, state: "error", toolName });
            throw error;
        }
    };
}

export function createAssistantTools(options: AssistantToolOptions = {}) {
    return {
        calculateQuote: {
            description:
                "Calculate deterministic air cargo quote totals from a reviewed tariff row and reviewed fee rule.",
            execute: createTrackedExecute(
                "calculateQuote",
                calculateQuoteTool,
                options
            ),
            inputSchema: calculateQuoteInputSchema,
        },
        classifyIntent: {
            description:
                "Classify a user query into Formalist chat modes before choosing retrieval or quote tools.",
            execute: createTrackedExecute(
                "classifyIntent",
                classifyIntent,
                options
            ),
            inputSchema: classifyIntentInputSchema,
        },
        compareTariffs: {
            description:
                "Compare active reviewed tariffs and detect promo/regular ambiguity.",
            execute: createTrackedExecute(
                "compareTariffs",
                (input: z.infer<typeof compareTariffsInputSchema>) =>
                    compareTariffs(input, input.mode ?? "unspecified"),
                options
            ),
            inputSchema: compareTariffsInputSchema,
        },
        flagAmbiguity: {
            description:
                "Return clarification candidates for ambiguous aliases, promo/regular, route, or date choices.",
            execute: createTrackedExecute(
                "flagAmbiguity",
                async (input: typeof ambiguityInputSchema._zod.output) => {
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
                options
            ),
            inputSchema: ambiguityInputSchema,
        },
        getFeeRules: {
            description:
                "Find the applicable active reviewed fee rule for an airline or document.",
            execute: createTrackedExecute(
                "getFeeRules",
                findApplicableFeeRule,
                options
            ),
            inputSchema: feeRuleInputSchema,
        },
        getSourceEvidence: {
            description:
                "Fetch source evidence and document metadata for a supported citation source.",
            execute: createTrackedExecute(
                "getSourceEvidence",
                (input: z.infer<typeof sourceEvidenceInputSchema>) =>
                    buildSourcePreview(input.sourceType, input.sourceId),
                options
            ),
            inputSchema: sourceEvidenceInputSchema,
        },
        hybridSearch: {
            description:
                "Run hybrid retrieval across document chunks, table chunks, and full-text search.",
            execute: createTrackedExecute(
                "hybridSearch",
                hybridSearch,
                options
            ),
            inputSchema: retrievalInputSchema,
        },
        listDestinations: {
            description: "List destinations from active reviewed tariff rows.",
            execute: createTrackedExecute(
                "listDestinations",
                listDestinations,
                options
            ),
            inputSchema: listDestinationsInputSchema,
        },
        listDocuments: {
            description:
                "List uploaded source documents and their ingestion/review status. Use this when the user asks what documents, files, uploads, memories, or sources are available.",
            execute: createTrackedExecute(
                "listDocuments",
                listDocumentInventory,
                options
            ),
            inputSchema: documentListInputSchema,
        },
        resolveAliases: {
            description:
                "Resolve fuzzy or ambiguous city, airport, airline, route, or destination aliases.",
            execute: createTrackedExecute(
                "resolveAliases",
                resolveAlias,
                options
            ),
            inputSchema: aliasInputSchema,
        },
        retrieveChunks: {
            description:
                "Retrieve semantic document chunks for general document Q&A.",
            execute: createTrackedExecute(
                "retrieveChunks",
                searchDocumentChunks,
                options
            ),
            inputSchema: retrievalInputSchema,
        },
        retrieveTableChunks: {
            description:
                "Retrieve table-aware chunks for source lookup and unverified table context.",
            execute: createTrackedExecute(
                "retrieveTableChunks",
                searchTableChunks,
                options
            ),
            inputSchema: retrievalInputSchema,
        },
        searchFacts: {
            description:
                "Search extracted facts. Use active status for trusted numeric answers.",
            execute: createTrackedExecute("searchFacts", searchFacts, options),
            inputSchema: factSearchInputSchema,
        },
        searchTariffs: {
            description:
                "Search tariff rows. Defaults to active reviewed rows and is required for trusted price answers.",
            execute: createTrackedExecute(
                "searchTariffs",
                searchTariffs,
                options
            ),
            inputSchema: tariffSearchInputSchema,
        },
        verifyAnswer: {
            description:
                "Verify answer confidence from source counts, trusted source counts, and warnings.",
            execute: createTrackedExecute(
                "verifyAnswer",
                verifyAnswer,
                options
            ),
            inputSchema: verifyAnswerInputSchema,
        },
    };
}

export const aiSdkToolsDecision =
    "Formalist uses AI SDK native tool calling and durable DB persistence. ai-sdk-tools.dev state/cache helpers are deferred until a concrete cache/state need appears in the route orchestration.";
