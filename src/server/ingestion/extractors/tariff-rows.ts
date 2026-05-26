import { generateText, Output } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterChatSettings } from "#/server/ai/openrouter-routing";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { createBoundedExtractionPrompt } from "./cost-controls";
import { ExtractionSetupRequiredError } from "./policy";
import { buildExtractionPrompt } from "./prompt";
import type { ExtractionSourceContext } from "./prompt";
import { tariffRowExtractionSchema } from "./schemas";
import type { TariffRowExtraction } from "./schemas";

const tariffRowsExtractionSchema = z.object({
    tariffRows: z.array(tariffRowExtractionSchema),
});

export async function extractTariffRows(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): Promise<TariffRowExtraction[]> {
    const provider = getOpenRouterProvider();

    if (provider.status === "setup-required") {
        throw new ExtractionSetupRequiredError(provider.reason);
    }

    const { extractionModel } = getModelConfiguration();
    const boundedPrompt = createBoundedExtractionPrompt({
        label: "tariff-row-extraction",
        prompt: buildExtractionPrompt(parseResult, context),
    });
    const result = await generateText({
        maxOutputTokens: 2000,
        maxRetries: 0,
        model: provider.openrouter.chat(
            extractionModel,
            getOpenRouterChatSettings()
        ),
        output: Output.object({
            name: "TariffRowExtraction",
            schema: tariffRowsExtractionSchema,
        }),
        prompt: boundedPrompt.prompt,
        temperature: 0,
    });

    return result.output.tariffRows;
}
