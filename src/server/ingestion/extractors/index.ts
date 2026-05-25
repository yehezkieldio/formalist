import { setTimeout as wait } from "node:timers/promises";

import { env } from "#/env";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import {
    extractDeterministicDocumentMetadata,
    extractDeterministicTariffRows,
} from "./deterministic";
import { extractFacts } from "./facts";
import { extractFeeRules } from "./fee-rules";
import { isExtractionSetupRequired } from "./policy";
import type { ExtractionSourceContext } from "./prompt";
import type { StructuredExtraction } from "./schemas";
import { extractTariffRows } from "./tariff-rows";

class OptionalExtractionTimeoutError extends Error {
    constructor() {
        super("Optional LLM extraction timed out.");
        this.name = "OptionalExtractionTimeoutError";
    }
}

async function timeoutAfter(timeoutMs: number): Promise<never> {
    await wait(timeoutMs);
    throw new OptionalExtractionTimeoutError();
}

function withTimeout<T>(task: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([task, timeoutAfter(timeoutMs)]);
}

async function useOptionalLlmExtraction<T>(
    enabled: boolean,
    createTask: () => Promise<T>,
    fallback: T
): Promise<T> {
    if (!enabled) {
        return fallback;
    }

    try {
        return await withTimeout(createTask(), env.LLM_EXTRACTION_TIMEOUT_MS);
    } catch (error) {
        if (isExtractionSetupRequired(error)) {
            throw error;
        }

        return fallback;
    }
}

export async function extractStructuredRecords(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): Promise<StructuredExtraction> {
    const deterministicDocumentMetadata =
        extractDeterministicDocumentMetadata(parseResult);
    const deterministicTariffRows = extractDeterministicTariffRows(
        parseResult,
        context
    );
    const [facts, tariffRows, feeRules] = await Promise.all([
        useOptionalLlmExtraction(
            env.ENABLE_LLM_FACT_EXTRACTION,
            () => extractFacts(parseResult, context),
            []
        ),
        useOptionalLlmExtraction(
            env.ENABLE_LLM_TARIFF_EXTRACTION,
            () => extractTariffRows(parseResult, context),
            deterministicTariffRows
        ),
        useOptionalLlmExtraction(
            env.ENABLE_LLM_FEE_RULE_EXTRACTION,
            () => extractFeeRules(parseResult, context),
            []
        ),
    ]);

    return {
        documentMetadata: deterministicDocumentMetadata,
        facts,
        feeRules,
        tariffRows:
            tariffRows.length > 0 ? tariffRows : deterministicTariffRows,
    };
}
