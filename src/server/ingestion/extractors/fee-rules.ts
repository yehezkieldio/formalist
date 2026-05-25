import { generateText, Output } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterChatSettings } from "#/server/ai/openrouter-routing";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { createBoundedExtractionPrompt } from "./cost-controls";
import { ExtractionSetupRequiredError } from "./policy";
import { buildCompactExtractionPrompt } from "./prompt";
import type { ExtractionSourceContext } from "./prompt";
import { feeRuleExtractionSchema } from "./schemas";
import type { FeeRuleExtraction } from "./schemas";

const feeRulesExtractionSchema = z.object({
    feeRules: z.array(feeRuleExtractionSchema),
});

export async function extractFeeRules(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): Promise<FeeRuleExtraction[]> {
    const provider = getOpenRouterProvider();

    if (provider.status === "setup-required") {
        throw new ExtractionSetupRequiredError(provider.reason);
    }

    const { extractionModel } = getModelConfiguration();
    const boundedPrompt = createBoundedExtractionPrompt({
        label: "fee-rule-extraction",
        prompt: buildCompactExtractionPrompt({
            context,
            keywords:
                /\b(admin|warehouse|gudang|ppn|pajak|min|minimum|surcharge|dg|dangerous|shipdec|karantina|quarantine|fee|biaya)\b/iu,
            maxRows: 60,
            parseResult,
            task: "Extract only fee rules from air cargo pricelist notes. Do not extract tariff destination rows.",
        }),
    });
    const result = await generateText({
        maxOutputTokens: 1000,
        maxRetries: 0,
        model: provider.openrouter.chat(
            extractionModel,
            getOpenRouterChatSettings()
        ),
        output: Output.object({
            name: "FeeRuleExtraction",
            schema: feeRulesExtractionSchema,
        }),
        prompt: boundedPrompt.prompt,
        temperature: 0,
    });

    return result.output.feeRules;
}
