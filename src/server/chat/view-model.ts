import type { FormalistChatMessage } from "#/components/ai/types";
import { chatMessageService } from "#/server/chat/messages";
import { chatSourceService } from "#/server/chat/sources";
import { chatToolCallService } from "#/server/chat/tool-calls";
import { answerVerificationService } from "#/server/chat/verifications";

function normalizeRole(role: string): FormalistChatMessage["role"] {
    if (
        role === "assistant" ||
        role === "system" ||
        role === "tool" ||
        role === "user"
    ) {
        return role;
    }

    return "assistant";
}

function normalizeMetadata(
    metadata: unknown
): FormalistChatMessage["metadata"] {
    if (!metadata || typeof metadata !== "object") {
        return null;
    }

    return metadata as FormalistChatMessage["metadata"];
}

export async function getChatMessagesForView(sessionId: string) {
    const [messages, toolCalls] = await Promise.all([
        chatMessageService.list(sessionId),
        chatToolCallService.list(sessionId),
    ]);
    const messageIds = messages.map((message) => message.id);
    const [sources, verifications] = await Promise.all([
        chatSourceService.list(messageIds),
        answerVerificationService.list(messageIds),
    ]);

    return messages.map<FormalistChatMessage>((message) => {
        const messageSources = sources.filter(
            (source) => source.messageId === message.id
        );
        const messageToolCalls = toolCalls.filter(
            (toolCall) => toolCall.messageId === message.id
        );
        const verification = verifications.find(
            (item) => item.messageId === message.id
        );

        return {
            content: message.content,
            createdAt: message.createdAt,
            id: message.id,
            metadata: normalizeMetadata(message.metadata),
            parts: message.parts,
            role: normalizeRole(message.role),
            sources: messageSources.map((source) => ({
                id: source.id,
                metadata: source.metadata,
                snippet: source.snippet,
                sourceId: source.sourceId,
                sourceType: source.sourceType,
                title: source.title,
            })),
            toolCalls: messageToolCalls.map((toolCall) => ({
                completedAt: toolCall.completedAt,
                error: toolCall.error,
                id: toolCall.id,
                input: toolCall.input,
                output: toolCall.output,
                startedAt: toolCall.startedAt,
                state: toolCall.state,
                toolName: toolCall.toolName,
            })),
            verification: verification
                ? {
                      confidenceState: verification.confidenceState,
                      mode: verification.mode,
                      warnings: verification.warnings,
                  }
                : null,
        };
    });
}
