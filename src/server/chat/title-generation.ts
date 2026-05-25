import { generateText } from "ai";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";

export function fallbackChatTitle(prompt: string) {
    return prompt.trim().replaceAll(/\s+/gu, " ").slice(0, 48) || "New chat";
}

export async function generateChatTitle(prompt: string) {
    const provider = getOpenRouterProvider();

    if (provider.status === "setup-required") {
        return fallbackChatTitle(prompt);
    }

    const { chatModel } = getModelConfiguration();
    const result = await generateText({
        model: provider.openrouter(chatModel),
        prompt: `Create a concise chat title under 6 words for:\n${prompt}`,
        temperature: 0,
    });

    return fallbackChatTitle(result.text);
}
