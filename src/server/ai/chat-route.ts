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
import { formalistSystemPrompt } from "#/server/ai/system-prompt";
import { createAssistantTools } from "#/server/ai/tools";
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

async function persistAssistantMessage(input: {
    message: UIMessage;
    mode: "general_rag" | "verified_numeric";
    sessionId?: string;
}) {
    if (!input.sessionId) {
        return;
    }

    const content = getMessageText(input.message);
    const message = await chatMessageService.create({
        content,
        metadata: input.message.metadata,
        parts: input.message.parts,
        role: "assistant",
        sessionId: input.sessionId,
    });
    const verification = verifyAnswer({
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

async function streamChatResponse(input: {
    messages: UIMessage[];
    provider: Extract<AiProviderState, { status: "ready" }>;
    sessionId?: string;
}) {
    const { chatModel } = getModelConfiguration();
    const lastUserText = getLastUserText(input.messages);
    const intent = classifyIntent({
        query: lastUserText || "general question",
    });
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
                mode:
                    intent === "quote" || intent === "verified_numeric"
                        ? "verified_numeric"
                        : "general_rag",
                sessionId: input.sessionId,
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
