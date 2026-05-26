import { countTokens, decode, encode } from "gpt-tokenizer";

import { env } from "#/env";

export interface BoundedPromptInput {
    label: string;
    maxInputTokens?: number;
    prompt: string;
}

export interface BoundedPrompt {
    estimatedTokens: number;
    prompt: string;
    truncated: boolean;
}

export function createBoundedExtractionPrompt(
    input: BoundedPromptInput
): BoundedPrompt {
    const maxInputTokens =
        input.maxInputTokens ?? env.MAX_EXTRACTION_INPUT_TOKENS;
    const estimatedTokens = countTokens(input.prompt);

    if (estimatedTokens <= maxInputTokens) {
        return {
            estimatedTokens,
            prompt: input.prompt,
            truncated: false,
        };
    }

    const marker = `[Formalist extraction guard: ${input.label} prompt truncated from approximately ${estimatedTokens} tokens to stay under ${maxInputTokens} tokens.]`;
    const markerTokens = countTokens(marker);
    const promptTokenBudget = Math.max(1, maxInputTokens - markerTokens - 4);
    const truncatedBody = decode(
        encode(input.prompt).slice(0, promptTokenBudget)
    );
    const truncatedPrompt = [truncatedBody, "", marker].join("\n");

    return {
        estimatedTokens: countTokens(truncatedPrompt),
        prompt: truncatedPrompt,
        truncated: true,
    };
}
