import { generateText, Output } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { createBoundedExtractionPrompt } from "./cost-controls";
import { ExtractionSetupRequiredError } from "./policy";
import { buildCompactExtractionPrompt } from "./prompt";
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

    const { extractionModel } = getModelConfiguration();
    const boundedPrompt = createBoundedExtractionPrompt({
        label: "fact-extraction",
        prompt: buildCompactExtractionPrompt({
            context,
            keywords:
                /\b(valid|validity|efektif|effective|promo|ppn|surcharge|minimum|min|admin|warehouse|gudang|shipdec|karantina|quarantine)\b/iu,
            parseResult,
            task: "Extract only document-level air cargo facts, validity rules, promo rules, fee notes, surcharge notes, PPN notes, and minimum-weight notes.",
        }),
    });
    const result = await generateText({
        maxOutputTokens: 1200,
        maxRetries: 0,
        model: provider.openrouter(extractionModel),
        output: Output.object({
            name: "FactExtraction",
            schema: factsExtractionSchema,
        }),
        prompt: boundedPrompt.prompt,
        temperature: 0,
    });

    return result.output.facts;
}
