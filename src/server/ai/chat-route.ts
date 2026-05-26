import {
    convertToModelMessages,
    createUIMessageStream,
    createUIMessageStreamResponse,
    stepCountIs,
    streamText,
} from "ai";
import type { UIMessage } from "ai";
import * as z from "zod";

import { getDirectChatAnswer } from "#/server/ai/chat/direct-answers";
import {
    buildToolResultFallback,
    needsFinalAnswerRepair,
} from "#/server/ai/chat/final-answer-guard";
import { createChatLogger } from "#/server/ai/chat/logger";
import { getLastUserText, getMessageText } from "#/server/ai/chat/message-text";
import {
    ensureSessionTitle,
    persistAssistantContent,
    persistAssistantMessage,
    persistLatestUserMessage,
} from "#/server/ai/chat/persistence";
import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterChatSettings } from "#/server/ai/openrouter-routing";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { AiProviderState } from "#/server/ai/provider";
import { serializeToolCallForStream } from "#/server/ai/stream-events";
import { formalistSystemPrompt } from "#/server/ai/system-prompt";
import { createAssistantTools } from "#/server/ai/tools";
import type { AssistantToolEvent } from "#/server/ai/tools";
import { classifyIntentFallback } from "#/server/ai/tools/classify-intent";
import type { ClassifiedIntent } from "#/server/ai/tools/classify-intent";

const chatRequestSchema = z.object({
    messages: z.array(z.custom<UIMessage>()),
    sessionId: z.uuid().optional(),
});

function modeFromIntent(intent: ClassifiedIntent) {
    return intent === "quote" || intent === "verified_numeric"
        ? "verified_numeric"
        : "general_rag";
}

function writeStatus(
    writer: Parameters<
        Parameters<typeof createUIMessageStream>[0]["execute"]
    >[0]["writer"],
    data: Record<string, unknown>
) {
    writer.write({
        data,
        transient: true,
        type: "data-status",
    });
}

function createPersistedTextStreamResponse(input: {
    content: string;
    evidenceSnippets?: string[];
    intent: ClassifiedIntent;
    logger?: ReturnType<typeof createChatLogger>;
    messages: UIMessage[];
    mode: "general_rag" | "verified_numeric";
    sessionId?: string;
    status?: string;
}) {
    const messageId = crypto.randomUUID();
    const textId = crypto.randomUUID();
    const stream = createUIMessageStream({
        execute: async ({ writer }) => {
            writer.write({ messageId, type: "start" });

            if (input.status) {
                writeStatus(writer, { label: input.status });
            }

            const titlePrompt = await persistLatestUserMessage(
                input.sessionId,
                input.messages,
                input.logger
            );
            await persistAssistantContent({
                content: input.content,
                evidenceSnippets: input.evidenceSnippets ?? [input.content],
                id: messageId,
                logger: input.logger,
                metadata: { intent: input.intent },
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
            await ensureSessionTitle({
                logger: input.logger,
                sessionId: input.sessionId,
                titlePrompt,
            });
            input.logger?.info("request:finish");
        },
    });

    return createUIMessageStreamResponse({ status: 200, stream });
}

function writeToolStatus(
    writer: Parameters<
        Parameters<typeof createUIMessageStream>[0]["execute"]
    >[0]["writer"],
    event: AssistantToolEvent
) {
    const serialized = serializeToolCallForStream({
        input: event.input,
        output: "output" in event ? event.output : undefined,
        toolName: event.toolName,
    });

    writeStatus(writer, {
        error: "error" in event ? event.error : undefined,
        input: serialized.input,
        label:
            event.state === "running"
                ? `Using ${event.toolName}`
                : `${event.toolName} ${event.state}`,
        output: serialized.output,
        state: event.state,
        summary: serialized.summary,
        toolName: event.toolName,
    });
}

function writeTextToStream(
    writer: Parameters<
        Parameters<typeof createUIMessageStream>[0]["execute"]
    >[0]["writer"],
    text: string
) {
    const textId = crypto.randomUUID();

    writer.write({ id: textId, type: "text-start" });
    writer.write({
        delta: text,
        id: textId,
        type: "text-delta",
    });
    writer.write({ id: textId, type: "text-end" });
}

function getReasoningText(message: UIMessage) {
    return message.parts
        .filter((part) => part.type === "reasoning")
        .map((part) => part.text)
        .join("");
}

function buildRepairedMessageMetadata(message: UIMessage) {
    const metadata =
        message.metadata && typeof message.metadata === "object"
            ? message.metadata
            : {};
    const reasoning = getReasoningText(message);

    return reasoning.trim()
        ? { ...metadata, reasoning, repaired: true }
        : { ...metadata, repaired: true };
}

function buildRepairedMessageParts(message: UIMessage, fallback: string) {
    return [
        ...message.parts.filter((part) => part.type === "reasoning"),
        { text: fallback, type: "text" as const },
    ];
}

function streamModelResponse(input: {
    logger: ReturnType<typeof createChatLogger>;
    messages: UIMessage[];
    mode: "general_rag" | "verified_numeric";
    provider: Extract<AiProviderState, { status: "ready" }>;
    intent: ClassifiedIntent;
    sessionId?: string;
}) {
    const { chatModel } = getModelConfiguration();
    const assistantMessageId = crypto.randomUUID();
    const toolEvents: AssistantToolEvent[] = [];
    const stream = createUIMessageStream({
        execute: async ({ writer }) => {
            writeStatus(writer, { label: "Preparing request" });

            const titlePrompt = await persistLatestUserMessage(
                input.sessionId,
                input.messages,
                input.logger
            );

            writeStatus(writer, { label: "Starting model stream" });

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
                        input.logger.info("model:first-chunk", {
                            chunkType: chunk.type,
                        });
                    }

                    if (chunk.type === "text-delta") {
                        writeStatus(writer, { label: "Writing answer" });
                    }
                },
                onError: ({ error }) => {
                    input.logger.info("model:error", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                },
                onStepFinish: ({ finishReason, usage }) => {
                    input.logger.info("model:step-finish", {
                        finishReason,
                        usage,
                    });
                },
                stopWhen: stepCountIs(5),
                system: `${formalistSystemPrompt}\n\nIntent: ${input.intent}.`,
                tools: createAssistantTools({
                    onToolEvent: (event) => {
                        toolEvents.push(event);
                        input.logger.info("tool:event", event);
                        writeToolStatus(writer, event);
                    },
                    sessionId: input.sessionId,
                }),
            });

            writer.merge(
                result.toUIMessageStream({
                    generateMessageId: () => assistantMessageId,
                    onError: (error) =>
                        error instanceof Error
                            ? error.message
                            : "The model returned an error before writing a response.",
                    onFinish: async ({ responseMessage }) => {
                        const responseText = getMessageText(responseMessage);
                        input.logger.info("stream:finish", {
                            responseLength: responseText.length,
                            toolEventCount: toolEvents.length,
                        });

                        if (
                            needsFinalAnswerRepair({
                                text: responseText,
                                toolEvents,
                            })
                        ) {
                            const fallback =
                                buildToolResultFallback(toolEvents);
                            input.logger.info("stream:repair-final-answer", {
                                fallbackLength: fallback.length,
                            });
                            writeTextToStream(writer, fallback);
                            await persistAssistantContent({
                                content: fallback,
                                evidenceSnippets: [fallback],
                                id: assistantMessageId,
                                logger: input.logger,
                                metadata:
                                    buildRepairedMessageMetadata(
                                        responseMessage
                                    ),
                                mode: input.mode,
                                parts: buildRepairedMessageParts(
                                    responseMessage,
                                    fallback
                                ),
                                sessionId: input.sessionId,
                            });
                        } else {
                            await persistAssistantMessage({
                                logger: input.logger,
                                message: responseMessage,
                                mode: input.mode,
                                sessionId: input.sessionId,
                            });
                        }

                        await ensureSessionTitle({
                            logger: input.logger,
                            sessionId: input.sessionId,
                            titlePrompt,
                        });
                        input.logger.info("request:finish");
                    },
                    originalMessages: input.messages,
                })
            );
        },
    });

    return createUIMessageStreamResponse({ stream });
}

async function streamChatResponse(input: {
    messages: UIMessage[];
    provider: Extract<AiProviderState, { status: "ready" }>;
    sessionId?: string;
}) {
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
    logger.info("cache:disabled");

    const directAnswer = await getDirectChatAnswer({
        intent,
        messages: input.messages,
        mode,
        query: lastUserText,
    });

    if (directAnswer) {
        logger.info(directAnswer.stage);

        return createPersistedTextStreamResponse({
            content: directAnswer.content,
            evidenceSnippets: directAnswer.evidenceSnippets,
            intent: directAnswer.intent,
            logger,
            messages: input.messages,
            mode: directAnswer.mode,
            sessionId: input.sessionId,
            status: directAnswer.status,
        });
    }

    return streamModelResponse({
        intent,
        logger,
        messages: input.messages,
        mode,
        provider: input.provider,
        sessionId: input.sessionId,
    });
}

export function createSetupRequiredStreamResponse(reason: string) {
    const message = `Setup required: ${reason} Add OPENROUTER_API_KEY to enable LLM extraction and chat.`;
    const messageId = crypto.randomUUID();
    const textId = crypto.randomUUID();
    const stream = createUIMessageStream({
        execute: ({ writer }) => {
            writer.write({ messageId, type: "start" });
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
