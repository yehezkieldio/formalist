"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

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
            parts: Array.isArray(message.parts)
                ? (message.parts as UIMessage["parts"])
                : [{ text: message.content, type: "text" }],
            role: toUiRole(message.role),
        }));
}

function getMessagesKey(messages: FormalistChatMessage[]) {
    return messages
        .map((message) =>
            JSON.stringify({
                content: message.content,
                id: message.id,
                metadata: message.metadata,
                parts: message.parts,
                role: message.role,
                toolCalls: message.toolCalls,
            })
        )
        .join("|");
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

function getToolCallId(status: ChatStreamStatus) {
    return `stream-${status.toolName ?? "tool"}-${JSON.stringify(status.input ?? null)}`;
}

function updateToolCalls(
    toolCalls: ChatToolCallData[],
    status: ChatStreamStatus
) {
    if (!status.toolName || !status.state) {
        return toolCalls;
    }

    const id = getToolCallId(status);
    const existingIndex = toolCalls.findIndex((toolCall) => toolCall.id === id);
    const now = new Date().toISOString();
    const nextToolCall: ChatToolCallData = {
        completedAt:
            status.state === "success" || status.state === "error"
                ? now
                : undefined,
        error: status.error,
        id,
        input: status.input,
        output: status.output,
        startedAt:
            existingIndex === -1 ? now : toolCalls[existingIndex].startedAt,
        state: status.state,
        toolName: status.toolName,
    };

    if (existingIndex === -1) {
        return [...toolCalls, nextToolCall];
    }

    return toolCalls.map((toolCall, index) =>
        index === existingIndex
            ? {
                  ...toolCall,
                  ...nextToolCall,
                  startedAt: toolCall.startedAt,
              }
            : toolCall
    );
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
    const [streamToolCalls, setStreamToolCalls] = useState<ChatToolCallData[]>(
        []
    );
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
    const messagesKey = useMemo(
        () => getMessagesKey(initialMessages),
        [initialMessages]
    );
    const lastSyncedMessagesKeyRef = useRef(messagesKey);

    const chat = useChat({
        id: sessionId,
        messages,
        onData: (dataPart) => {
            const status = parseStreamStatus(dataPart);

            if (status) {
                setStreamStatus(status);
                setStreamToolCalls((current) =>
                    updateToolCalls(current, status)
                );
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
    const { setMessages, status } = chat;

    useEffect(() => {
        if (status === "submitted") {
            setStreamToolCalls([]);
        }
    }, [status]);

    useEffect(() => {
        setStreamStatus(undefined);
        setStreamToolCalls([]);
    }, [sessionId]);

    useEffect(() => {
        if (
            status !== "ready" ||
            lastSyncedMessagesKeyRef.current === messagesKey
        ) {
            return;
        }

        lastSyncedMessagesKeyRef.current = messagesKey;
        setMessages(messages);
    }, [messages, messagesKey, setMessages, status]);

    return { ...chat, streamStatus, streamToolCalls };
}
