"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useMemo } from "react";

import type { FormalistChatMessage } from "#/components/ai/types";

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

export function useChatStream({
    initialMessages,
    onFinish,
    sessionId,
}: {
    initialMessages: FormalistChatMessage[];
    onFinish: () => void;
    sessionId?: string;
}) {
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

    return useChat({
        id: sessionId,
        messages,
        onFinish,
        transport,
    });
}
