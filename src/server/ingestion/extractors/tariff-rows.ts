import { generateText, Output } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

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

    const { chatModel } = getModelConfiguration();
    const result = await generateText({
        model: provider.openrouter(chatModel),
        output: Output.object({
            name: "TariffRowExtraction",
            schema: tariffRowsExtractionSchema,
        }),
        prompt: buildExtractionPrompt(parseResult, context),
        temperature: 0,
    });

    return result.output.tariffRows;
}
