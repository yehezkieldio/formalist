"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useMemo, useState } from "react";

import type {
    ChatStreamStatus,
    ChatToolCallData,
    FormalistChatMessage,
} from "#/components/ai/types";

type UiMessageRole = UIMessage["role"];

function toUiRole(role: FormalistChatMessage["role"]): UiMessageRole {
    if (role === "assistant" || role === "system" || role === "user") {
        return role;
    }

    return "assistant";
}

function toUiMessages(messages: FormalistChatMessage[]): UIMessage[] {
    return messages
        .filter((message) => message.role !== "tool")
        .map((message) => ({
            id: message.id,
            metadata: message.metadata ?? undefined,
            parts: [{ text: message.content, type: "text" }],
            role: toUiRole(message.role),
        }));
}

function parseStreamStatus(dataPart: unknown): ChatStreamStatus | undefined {
    if (!dataPart || typeof dataPart !== "object") {
        return;
    }

    const record = dataPart as Record<string, unknown>;

    if (record.type !== "data-status") {
        return;
    }

    const { data } = record;

    if (!data || typeof data !== "object") {
        return;
    }

    const status = data as Record<string, unknown>;

    if (typeof status.label !== "string") {
        return;
    }

    return {
        error: typeof status.error === "string" ? status.error : undefined,
        input: status.input,
        label: status.label,
        output: status.output,
        state:
            status.state === "error" ||
            status.state === "running" ||
            status.state === "success"
                ? status.state
                : undefined,
        toolName:
            typeof status.toolName === "string" ? status.toolName : undefined,
    };
}

export function useChatStream({
    initialMessages,
    onFinish,
    sessionId,
}: {
    initialMessages: FormalistChatMessage[];
    onFinish: () => void;
    sessionId?: string;
}) {
    const [streamStatus, setStreamStatus] = useState<
        ChatStreamStatus | undefined
    >();
    const [liveToolCalls, setLiveToolCalls] = useState<ChatToolCallData[]>([]);
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                body: sessionId ? { sessionId } : {},
            }),
        [sessionId]
    );
    const messages = useMemo(
        () => toUiMessages(initialMessages),
        [initialMessages]
    );

    const chat = useChat({
        id: sessionId,
        messages,
        onData: (dataPart) => {
            const status = parseStreamStatus(dataPart);

            if (status) {
                setStreamStatus(status);

                if (
                    status.label === "Preparing request" ||
                    status.label === "Listing documents"
                ) {
                    setLiveToolCalls([]);
                }

                const { toolName } = status;
                const { state } = status;

                if (toolName && state) {
                    setLiveToolCalls((current) => {
                        const matchingIndex = current.findLastIndex(
                            (toolCall) =>
                                toolCall.toolName === toolName &&
                                toolCall.state === "running"
                        );

                        if (matchingIndex !== -1 && state !== "running") {
                            return current.map((toolCall, index) =>
                                index === matchingIndex
                                    ? {
                                          ...toolCall,
                                          completedAt: new Date().toISOString(),
                                          error: status.error,
                                          input: status.input,
                                          output: status.output,
                                          state,
                                      }
                                    : toolCall
                            );
                        }

                        return [
                            ...current,
                            {
                                completedAt:
                                    state === "running"
                                        ? null
                                        : new Date().toISOString(),
                                error: status.error,
                                id: `${Date.now()}-${current.length}-${toolName}`,
                                input: status.input,
                                output: status.output,
                                startedAt: new Date().toISOString(),
                                state,
                                toolName,
                            },
                        ];
                    });
                }
            }
        },
        onError: (error) => {
            setStreamStatus({ label: error.message, state: "error" });
        },
        onFinish: () => {
            setStreamStatus(undefined);
            onFinish();
        },
        transport,
    });

    return { ...chat, liveToolCalls, streamStatus };
}
