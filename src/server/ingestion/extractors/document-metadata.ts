import { generateText, Output } from "ai";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterChatSettings } from "#/server/ai/openrouter-routing";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { ExtractionSetupRequiredError } from "./policy";
import { buildExtractionPrompt } from "./prompt";
import type { ExtractionSourceContext } from "./prompt";
import { documentMetadataExtractionSchema } from "./schemas";
import type { DocumentMetadataExtraction } from "./schemas";

export async function extractDocumentMetadata(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): Promise<DocumentMetadataExtraction> {
    const provider = getOpenRouterProvider();

    if (provider.status === "setup-required") {
        throw new ExtractionSetupRequiredError(provider.reason);
    }

    const { extractionModel } = getModelConfiguration();
    const result = await generateText({
        model: provider.openrouter.chat(
            extractionModel,
            getOpenRouterChatSettings()
        ),
        output: Output.object({
            name: "DocumentMetadataExtraction",
            schema: documentMetadataExtractionSchema,
        }),
        prompt: buildExtractionPrompt(parseResult, context),
        temperature: 0,
    });

    return result.output;
}
