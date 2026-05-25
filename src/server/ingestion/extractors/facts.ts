import { generateText, Output } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { ExtractionSetupRequiredError } from "./policy";
import { buildExtractionPrompt } from "./prompt";
import type { ExtractionSourceContext } from "./prompt";
import { extractedFactSchema } from "./schemas";
import type { ExtractedFactExtraction } from "./schemas";

const factsExtractionSchema = z.object({
    facts: z.array(extractedFactSchema),
});

export async function extractFacts(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): Promise<ExtractedFactExtraction[]> {
    const provider = getOpenRouterProvider();

    if (provider.status === "setup-required") {
        throw new ExtractionSetupRequiredError(provider.reason);
    }

    const { chatModel } = getModelConfiguration();
    const result = await generateText({
        model: provider.openrouter(chatModel),
        output: Output.object({
            name: "FactExtraction",
            schema: factsExtractionSchema,
        }),
        prompt: buildExtractionPrompt(parseResult, context),
        temperature: 0,
    });

    return result.output.facts;
}
