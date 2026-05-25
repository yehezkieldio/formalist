import { generateText, Output } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { ExtractionSetupRequiredError } from "./policy";
import { buildExtractionPrompt } from "./prompt";
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

    const { chatModel } = getModelConfiguration();
    const result = await generateText({
        model: provider.openrouter(chatModel),
        output: Output.object({
            name: "FeeRuleExtraction",
            schema: feeRulesExtractionSchema,
        }),
        prompt: buildExtractionPrompt(parseResult, context),
        temperature: 0,
    });

    return result.output.feeRules;
}
