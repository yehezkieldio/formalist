import {
    convertToModelMessages,
    createUIMessageStream,
    createUIMessageStreamResponse,
    streamText,
} from "ai";
import type { UIMessage } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { AiProviderState } from "#/server/ai/provider";
import {
    createResponseCacheKey,
    getCachedChatResponse,
    setCachedChatResponse,
} from "#/server/ai/response-cache";
import { formalistSystemPrompt } from "#/server/ai/system-prompt";
import { createAssistantTools } from "#/server/ai/tools";
import type { ClassifiedIntent } from "#/server/ai/tools/classify-intent";
import { classifyIntent } from "#/server/ai/tools/classify-intent";
import { verifyAnswer } from "#/server/ai/tools/verify-answer";
import { chatMessageService } from "#/server/chat/messages";
import { answerVerificationService } from "#/server/chat/verifications";

const chatRequestSchema = z.object({
    messages: z.array(z.custom<UIMessage>()),
    sessionId: z.uuid().optional(),
});

function getMessageText(message: UIMessage) {
    return message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
}

function getLastUserText(messages: UIMessage[]) {
    const message = messages.findLast((item) => item.role === "user");

    return message ? getMessageText(message) : "";
}

function modeFromIntent(intent: ClassifiedIntent) {
    return intent === "quote" || intent === "verified_numeric"
        ? "verified_numeric"
        : "general_rag";
}

function getDirectEvidenceSnippet(record: Record<string, unknown>) {
    if (typeof record.snippet === "string") {
        return [record.snippet];
    }

    if (typeof record.rawEvidence === "string") {
        return [record.rawEvidence];
    }

    if (typeof record.rawRowText === "string") {
        return [record.rawRowText];
    }

    return [];
}

function extractEvidenceSnippets(value: unknown): string[] {
    if (!value) {
        return [];
    }

    if (typeof value === "string") {
        return value.trim().length > 0 ? [value] : [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) => extractEvidenceSnippets(item));
    }

    if (typeof value !== "object") {
        return [];
    }

    const record = value as Record<string, unknown>;
    const directSnippet = getDirectEvidenceSnippet(record);

    return [
        ...directSnippet,
        ...extractEvidenceSnippets(record.sources),
        ...extractEvidenceSnippets(record.results),
        ...extractEvidenceSnippets(record.evidence),
    ];
}

function extractMessageEvidenceSnippets(message: UIMessage) {
    return extractEvidenceSnippets(message.parts);
}

async function persistLatestUserMessage(
    sessionId: string | undefined,
    messages: UIMessage[]
) {
    if (!sessionId) {
        return;
    }

    const latestUserMessage = messages.findLast(
        (message) => message.role === "user"
    );

    if (!latestUserMessage) {
        return;
    }

    await chatMessageService.create({
        content: getMessageText(latestUserMessage),
        parts: latestUserMessage.parts,
        role: "user",
        sessionId,
    });
}

async function persistAssistantContent(input: {
    content: string;
    evidenceSnippets: string[];
    metadata?: unknown;
    mode: "general_rag" | "verified_numeric";
    parts?: unknown;
    sessionId?: string;
}) {
    if (!input.sessionId) {
        return;
    }

    const message = await chatMessageService.create({
        content: input.content,
        metadata: input.metadata,
        parts: input.parts,
        role: "assistant",
        sessionId: input.sessionId,
    });
    const verification = verifyAnswer({
        draftText: input.content,
        evidenceSnippets: input.evidenceSnippets,
        mode: input.mode,
        sourceCount: 1,
        trustedSourceCount: input.mode === "verified_numeric" ? 1 : 0,
        warnings: [],
    });

    await answerVerificationService.create({
        checks: verification.checks,
        confidenceState: verification.confidenceState,
        messageId: message.id,
        mode: input.mode,
        sessionId: input.sessionId,
        warnings: verification.warnings,
    });
}

async function persistAssistantMessage(input: {
    message: UIMessage;
    mode: "general_rag" | "verified_numeric";
    sessionId?: string;
}) {
    await persistAssistantContent({
        content: getMessageText(input.message),
        evidenceSnippets: extractMessageEvidenceSnippets(input.message),
        metadata: input.message.metadata,
        mode: input.mode,
        parts: input.message.parts,
        sessionId: input.sessionId,
    });
}

function createCachedChatStreamResponse(content: string) {
    const textId = crypto.randomUUID();
    const stream = createUIMessageStream({
        execute: ({ writer }) => {
            writer.write({ id: textId, type: "text-start" });
            writer.write({ delta: content, id: textId, type: "text-delta" });
            writer.write({ id: textId, type: "text-end" });
        },
    });

    return createUIMessageStreamResponse({ status: 200, stream });
}

async function streamChatResponse(input: {
    messages: UIMessage[];
    provider: Extract<AiProviderState, { status: "ready" }>;
    sessionId?: string;
}) {
    const { chatModel } = getModelConfiguration();
    const lastUserText = getLastUserText(input.messages);
    const intent = await classifyIntent({
        query: lastUserText || "general question",
    });
    const mode = modeFromIntent(intent);
    const cacheKey = await createResponseCacheKey({
        intent,
        query: lastUserText,
    });
    const cachedResponse = await getCachedChatResponse(cacheKey);

    if (cachedResponse) {
        await persistAssistantContent({
            content: cachedResponse.content,
            evidenceSnippets: [],
            metadata: { cached: true, intent: cachedResponse.intent },
            mode: cachedResponse.mode,
            parts: [{ text: cachedResponse.content, type: "text" }],
            sessionId: input.sessionId,
        });

        return createCachedChatStreamResponse(cachedResponse.content);
    }

    const result = streamText({
        maxOutputTokens: 1200,
        messages: await convertToModelMessages(input.messages),
        model: input.provider.openrouter.chat(chatModel),
        system: `${formalistSystemPrompt}\n\nClassified intent: ${intent}.`,
        tools: createAssistantTools(),
    });

    return result.toUIMessageStreamResponse({
        onFinish: async ({ responseMessage }) => {
            await persistAssistantMessage({
                message: responseMessage,
                mode,
                sessionId: input.sessionId,
            });
            await setCachedChatResponse(cacheKey, {
                content: getMessageText(responseMessage),
                intent,
                mode,
                warnings: [],
            });
        },
        originalMessages: input.messages,
    });
}

export function createSetupRequiredStreamResponse(reason: string) {
    const message = `Setup required: ${reason} Add OPENROUTER_API_KEY to enable LLM extraction and chat.`;
    const textId = crypto.randomUUID();
    const stream = createUIMessageStream({
        execute: ({ writer }) => {
            writer.write({ id: textId, type: "text-start" });
            writer.write({ delta: message, id: textId, type: "text-delta" });
            writer.write({ id: textId, type: "text-end" });
        },
    });

    return createUIMessageStreamResponse({
        status: 200,
        stream,
    });
}

export async function handleChatRequest(request: Request) {
    const input = chatRequestSchema.parse(await request.json());
    const provider = getOpenRouterProvider();

    if (provider.status === "setup-required") {
        return createSetupRequiredStreamResponse(provider.reason);
    }

    await persistLatestUserMessage(input.sessionId, input.messages);

    return streamChatResponse({
        messages: input.messages,
        provider,
        sessionId: input.sessionId,
    });
}
