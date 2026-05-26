import {
    convertToModelMessages,
    createUIMessageStream,
    createUIMessageStreamResponse,
    stepCountIs,
    streamText,
} from "ai";
import type { UIMessage } from "ai";
import * as z from "zod";

import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterChatSettings } from "#/server/ai/openrouter-routing";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { AiProviderState } from "#/server/ai/provider";
import {
    createResponseCacheKey,
    getCachedChatResponse,
    setCachedChatResponse,
} from "#/server/ai/response-cache";
import { formalistSystemPrompt } from "#/server/ai/system-prompt";
import { createAssistantTools } from "#/server/ai/tools";
import { classifyIntentFallback } from "#/server/ai/tools/classify-intent";
import type { ClassifiedIntent } from "#/server/ai/tools/classify-intent";
import { verifyAnswer } from "#/server/ai/tools/verify-answer";
import { chatMessageService } from "#/server/chat/messages";
import { chatToolCallService } from "#/server/chat/tool-calls";
import { answerVerificationService } from "#/server/chat/verifications";

const chatRequestSchema = z.object({
    messages: z.array(z.custom<UIMessage>()),
    sessionId: z.uuid().optional(),
});

function createChatLogger(input: { query: string; sessionId?: string }) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const startedAt = Date.now();

    return {
        info(stage: string, details: Record<string, unknown> = {}) {
            console.info(
                `[chat] ${JSON.stringify({
                    elapsedMs: Date.now() - startedAt,
                    query: input.query,
                    requestId,
                    sessionId: input.sessionId,
                    stage,
                    ...details,
                })}`
            );
        },
    };
}

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
    messages: UIMessage[],
    logger?: ReturnType<typeof createChatLogger>
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

    logger?.info("persist-user-message:start");
    await chatMessageService.create({
        content: getMessageText(latestUserMessage),
        parts: latestUserMessage.parts,
        role: "user",
        sessionId,
    });
    logger?.info("persist-user-message:finish");
}

async function persistAssistantContent(input: {
    content: string;
    evidenceSnippets: string[];
    metadata?: unknown;
    mode: "general_rag" | "verified_numeric";
    parts?: unknown;
    sessionId?: string;
    logger?: ReturnType<typeof createChatLogger>;
}) {
    if (!input.sessionId) {
        return;
    }

    input.logger?.info("persist-assistant-message:start", {
        contentLength: input.content.length,
    });
    const message = await chatMessageService.create({
        content: input.content,
        metadata: input.metadata,
        parts: input.parts,
        role: "assistant",
        sessionId: input.sessionId,
    });

    await chatToolCallService.attachUnlinkedToMessage(
        input.sessionId,
        message.id
    );

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
    input.logger?.info("persist-assistant-message:finish", {
        confidenceState: verification.confidenceState,
        messageId: message.id,
    });
}

async function persistAssistantMessage(input: {
    logger?: ReturnType<typeof createChatLogger>;
    message: UIMessage;
    mode: "general_rag" | "verified_numeric";
    sessionId?: string;
}) {
    await persistAssistantContent({
        content: getMessageText(input.message),
        evidenceSnippets: extractMessageEvidenceSnippets(input.message),
        logger: input.logger,
        metadata: input.message.metadata,
        mode: input.mode,
        parts: input.message.parts,
        sessionId: input.sessionId,
    });
}

function createCachedChatStreamResponse(input: {
    content: string;
    intent: ClassifiedIntent;
    messages: UIMessage[];
    mode: "general_rag" | "verified_numeric";
    sessionId?: string;
    status?: string;
}) {
    const textId = crypto.randomUUID();
    const stream = createUIMessageStream({
        execute: async ({ writer }) => {
            if (input.status) {
                writer.write({
                    data: { label: input.status },
                    transient: true,
                    type: "data-status",
                });
            }
            await persistLatestUserMessage(input.sessionId, input.messages);
            await persistAssistantContent({
                content: input.content,
                evidenceSnippets: [],
                metadata: { cached: true, intent: input.intent },
                mode: input.mode,
                parts: [{ text: input.content, type: "text" }],
                sessionId: input.sessionId,
            });
            writer.write({ id: textId, type: "text-start" });
            writer.write({
                delta: input.content,
                id: textId,
                type: "text-delta",
            });
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
    const logger = createChatLogger({
        query: lastUserText,
        sessionId: input.sessionId,
    });
    logger.info("request:start", {
        messageCount: input.messages.length,
    });
    const intent = classifyIntentFallback({
        query: lastUserText || "general question",
    });
    const mode = modeFromIntent(intent);
    logger.info("intent:classified", { intent, mode });
    const cacheKey = await createResponseCacheKey({
        intent,
        query: lastUserText,
    });
    logger.info("cache:lookup:start");
    const cachedResponse = await getCachedChatResponse(cacheKey);
    logger.info("cache:lookup:finish", { hit: Boolean(cachedResponse) });

    if (cachedResponse) {
        return createCachedChatStreamResponse({
            content: cachedResponse.content,
            intent: cachedResponse.intent,
            messages: input.messages,
            mode: cachedResponse.mode,
            sessionId: input.sessionId,
            status: "Found a saved answer",
        });
    }

    const stream = createUIMessageStream({
        execute: async ({ writer }) => {
            writer.write({
                data: { label: "Preparing request" },
                transient: true,
                type: "data-status",
            });

            await persistLatestUserMessage(
                input.sessionId,
                input.messages,
                logger
            );

            writer.write({
                data: { label: "Starting model stream" },
                transient: true,
                type: "data-status",
            });

            let firstChunkSeen = false;
            const result = streamText({
                maxOutputTokens: 1200,
                messages: await convertToModelMessages(input.messages),
                model: input.provider.openrouter.chat(
                    chatModel,
                    getOpenRouterChatSettings()
                ),
                onChunk: ({ chunk }) => {
                    if (!firstChunkSeen) {
                        firstChunkSeen = true;
                        logger.info("model:first-chunk", {
                            chunkType: chunk.type,
                        });
                    }

                    if (chunk.type === "text-delta") {
                        writer.write({
                            data: { label: "Writing answer" },
                            transient: true,
                            type: "data-status",
                        });
                    }
                },
                onError: ({ error }) => {
                    logger.info("model:error", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                },
                onStepFinish: ({ finishReason, usage }) => {
                    logger.info("model:step-finish", {
                        finishReason,
                        usage,
                    });
                },
                stopWhen: stepCountIs(5),
                system: `${formalistSystemPrompt}\n\nIntent: ${intent}.`,
                tools: createAssistantTools({
                    onToolEvent: (event) => {
                        logger.info("tool:event", event);
                        writer.write({
                            data: {
                                error:
                                    "error" in event ? event.error : undefined,
                                label:
                                    event.state === "running"
                                        ? `Using ${event.toolName}`
                                        : `${event.toolName} ${event.state}`,
                                state: event.state,
                                toolName: event.toolName,
                            },
                            transient: true,
                            type: "data-status",
                        });
                    },
                    sessionId: input.sessionId,
                }),
            });

            writer.merge(
                result.toUIMessageStream({
                    onError: (error) =>
                        error instanceof Error
                            ? error.message
                            : "The model returned an error before writing a response.",
                    onFinish: async ({ responseMessage }) => {
                        logger.info("stream:finish", {
                            responseLength:
                                getMessageText(responseMessage).length,
                        });
                        await persistAssistantMessage({
                            logger,
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
                        logger.info("request:finish");
                    },
                })
            );
        },
    });

    return createUIMessageStreamResponse({ stream });
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

    return streamChatResponse({
        messages: input.messages,
        provider,
        sessionId: input.sessionId,
    });
}
