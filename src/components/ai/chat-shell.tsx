"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ConversationSidebar } from "#/components/ai/conversation-sidebar";
import { MessageList } from "#/components/ai/message-list";
import { PromptComposer } from "#/components/ai/prompt-composer";
import type {
    ChatToolCallData,
    FormalistChatMessage,
    FormalistChatSession,
} from "#/components/ai/types";
import { useChatStream } from "#/components/ai/use-chat-stream";
import { ThemeToggle } from "#/components/theme-toggle";

function mergeMessages(
    persistedMessages: FormalistChatMessage[],
    uiMessages: ReturnType<typeof useChatStream>["messages"]
) {
    const persistedById = new Map(
        persistedMessages.map((message) => [message.id, message])
    );

    return uiMessages.map<FormalistChatMessage>((message) => {
        const persisted = persistedById.get(message.id);

        if (persisted) {
            return persisted;
        }

        const content = message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");

        return {
            content,
            id: message.id,
            metadata:
                typeof message.metadata === "object" && message.metadata
                    ? (message.metadata as FormalistChatMessage["metadata"])
                    : null,
            role: message.role,
        };
    });
}

function mergeLiveToolCalls(
    messages: FormalistChatMessage[],
    liveToolCalls: ChatToolCallData[]
) {
    if (liveToolCalls.length === 0) {
        return messages;
    }

    const latestAssistantIndex = messages.findLastIndex(
        (message) => message.role === "assistant"
    );

    if (latestAssistantIndex === -1) {
        return [
            ...messages,
            {
                content: "",
                id: "live-assistant-tool-calls",
                role: "assistant" as const,
                toolCalls: liveToolCalls,
            },
        ];
    }

    return messages.map((message, index) =>
        index === latestAssistantIndex
            ? {
                  ...message,
                  toolCalls: message.toolCalls?.length
                      ? message.toolCalls
                      : liveToolCalls,
              }
            : message
    );
}

export function ChatShell({
    activeSessionId,
    initialMessages,
    sessions,
}: {
    activeSessionId?: string;
    initialMessages: FormalistChatMessage[];
    sessions: FormalistChatSession[];
}) {
    const router = useRouter();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [visibleSessions, setVisibleSessions] = useState(sessions);
    const {
        error,
        liveToolCalls,
        messages,
        regenerate,
        sendMessage,
        status,
        stop,
        streamStatus,
    } = useChatStream({
        initialMessages,
        onFinish: () => router.refresh(),
        sessionId: activeSessionId,
    });
    const isStreaming = status === "streaming" || status === "submitted";
    const displayMessages = useMemo(
        () =>
            mergeLiveToolCalls(
                mergeMessages(initialMessages, messages),
                liveToolCalls
            ),
        [initialMessages, liveToolCalls, messages]
    );

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;

        if (!scrollArea) {
            return;
        }

        scrollArea.scrollTo({
            behavior: isStreaming ? "smooth" : "auto",
            top: scrollArea.scrollHeight,
        });
    }, [displayMessages, isStreaming, liveToolCalls, streamStatus]);

    const submitMessage = (content: string) => {
        void sendMessage({ text: content });
    };

    return (
        <main className="flex h-dvh overflow-hidden bg-background text-foreground">
            <ConversationSidebar
                activeSessionId={activeSessionId}
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
                onSessionDeleted={(sessionId) => {
                    setVisibleSessions((current) =>
                        current.filter((session) => session.id !== sessionId)
                    );
                }}
                onSessionRenamed={(sessionId, title) => {
                    setVisibleSessions((current) =>
                        current.map((session) =>
                            session.id === sessionId
                                ? { ...session, title }
                                : session
                        )
                    );
                }}
                sessions={visibleSessions}
            />
            <motion.section
                key={activeSessionId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
                <header className="flex h-14 items-center justify-between border-b px-4">
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-tight text-foreground/90">
                            {visibleSessions.find(
                                (session) => session.id === activeSessionId
                            )?.title ?? "New chat"}
                        </p>
                    </div>
                    <ThemeToggle />
                </header>
                <div
                    ref={scrollAreaRef}
                    className="min-h-0 flex-1 overflow-auto"
                >
                    <MessageList
                        isStreaming={isStreaming}
                        messages={displayMessages}
                        onRegenerate={() => {
                            void regenerate();
                        }}
                        onSelectExample={submitMessage}
                    />
                    {error ? (
                        <div className="mx-auto mb-4 max-w-4xl rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                            {error.message}
                        </div>
                    ) : null}
                </div>
                <PromptComposer
                    disabled={!activeSessionId}
                    isStreaming={isStreaming}
                    onStop={() => {
                        void stop();
                    }}
                    onSubmit={submitMessage}
                />
            </motion.section>
        </main>
    );
}
