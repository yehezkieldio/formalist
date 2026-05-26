import {
    convertToModelMessages,
    createUIMessageStream,
    createUIMessageStreamResponse,
    generateText,
    Output,
    stepCountIs,
    streamText,
} from "ai";
import type { UIMessage, UIMessageChunk } from "ai";
import * as z from "zod";

import {
    buildRepairEvidence,
    buildToolResultFallbackMetadata,
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

const repairedAnswerSchema = z.object({
    answer: z.string().min(1),
    evidenceSnippets: z.array(z.string()).default([]),
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

function isBufferedModelTextChunk(chunk: UIMessageChunk) {
    return (
        chunk.type === "text-start" ||
        chunk.type === "text-delta" ||
        chunk.type === "text-end"
    );
}

function isForwardedLiveModelChunk(chunk: UIMessageChunk) {
    return (
        chunk.type === "reasoning-start" ||
        chunk.type === "reasoning-delta" ||
        chunk.type === "reasoning-end" ||
        chunk.type === "error" ||
        chunk.type === "message-metadata"
    );
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

async function repairFinalAnswer(input: {
    originalAnswer: string;
    provider: Extract<AiProviderState, { status: "ready" }>;
    query: string;
    toolEvents: AssistantToolEvent[];
}) {
    const { chatModel } = getModelConfiguration();
    const evidence = buildRepairEvidence({
        originalAnswer: input.originalAnswer,
        query: input.query,
        toolEvents: input.toolEvents,
    });
    const result = await generateText({
        maxOutputTokens: 900,
        model: input.provider.openrouter.chat(
            chatModel,
            getOpenRouterChatSettings()
        ),
        output: Output.object({ schema: repairedAnswerSchema }),
        prompt: JSON.stringify(evidence),
        system: [
            "You repair a failed Formalist air-cargo RAG answer.",
            "Return only a user-facing answer in Bahasa Indonesia and short evidence snippets.",
            "Use the provided tool results as evidence. Do not mention internal tool names unless necessary for debugging.",
            "Do not include chain-of-thought, planning narration, raw JSON, or tool payload dumps.",
            "If table chunks or source snippets contain the answer, synthesize them directly instead of asking for fields already present.",
            "If results conflict, present the conflicting values and ask for the discriminator needed to choose one.",
        ].join("\n"),
    });

    return result.output;
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
            writer.write({
                messageId: assistantMessageId,
                type: "start",
            });
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

            const bufferedTextChunks: UIMessageChunk[] = [];
            let shouldEmitBufferedText = true;

            const modelStream = result.toUIMessageStream({
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
                        shouldEmitBufferedText = false;
                        const repairedAnswer = await repairFinalAnswer({
                            originalAnswer: responseText,
                            provider: input.provider,
                            query: getLastUserText(input.messages),
                            toolEvents,
                        });
                        const fallbackMetadata =
                            buildToolResultFallbackMetadata(toolEvents);
                        input.logger.info("stream:repair-final-answer", {
                            fallbackLength: repairedAnswer.answer.length,
                        });
                        if (fallbackMetadata) {
                            writer.write({
                                messageMetadata: {
                                    ...fallbackMetadata,
                                    repaired: true,
                                },
                                type: "message-metadata",
                            });
                        }
                        writeTextToStream(writer, repairedAnswer.answer);
                        await persistAssistantContent({
                            content: repairedAnswer.answer,
                            evidenceSnippets:
                                repairedAnswer.evidenceSnippets.length > 0
                                    ? repairedAnswer.evidenceSnippets
                                    : [repairedAnswer.answer],
                            id: assistantMessageId,
                            logger: input.logger,
                            metadata: fallbackMetadata
                                ? {
                                      ...buildRepairedMessageMetadata(
                                          responseMessage
                                      ),
                                      ...fallbackMetadata,
                                  }
                                : buildRepairedMessageMetadata(responseMessage),
                            mode: input.mode,
                            parts: buildRepairedMessageParts(
                                responseMessage,
                                repairedAnswer.answer
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
                sendStart: false,
            });

            for await (const chunk of modelStream) {
                if (isBufferedModelTextChunk(chunk)) {
                    bufferedTextChunks.push(chunk);
                    continue;
                }

                if (isForwardedLiveModelChunk(chunk)) {
                    writer.write(chunk);
                }
            }

            if (shouldEmitBufferedText) {
                for (const chunk of bufferedTextChunks) {
                    writer.write(chunk);
                }
            }
        },
    });

    return createUIMessageStreamResponse({ stream });
}

function streamChatResponse(input: {
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
