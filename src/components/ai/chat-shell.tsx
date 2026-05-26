"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ConversationSidebar } from "#/components/ai/conversation-sidebar";
import { MessageList } from "#/components/ai/message-list";
import { PromptComposer } from "#/components/ai/prompt-composer";
import type {
    FormalistChatMessage,
    FormalistChatSession,
} from "#/components/ai/types";
import { useChatStream } from "#/components/ai/use-chat-stream";
import { ThemeToggle } from "#/components/theme-toggle";
import { cn } from "#/lib/utils";

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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [visibleSessions, setVisibleSessions] = useState(sessions);
    const {
        error,
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
    const displayMessages = useMemo(
        () => mergeMessages(initialMessages, messages),
        [initialMessages, messages]
    );
    const isStreaming = status === "streaming" || status === "submitted";

    const submitMessage = (content: string) => {
        void sendMessage({ text: content });
    };

    return (
        <main
            className={cn(
                "grid h-dvh bg-background text-foreground",
                sidebarCollapsed
                    ? "md:grid-cols-[3.5rem_minmax(0,1fr)]"
                    : "md:grid-cols-[18rem_minmax(0,1fr)]"
            )}
        >
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
            <section className="flex min-h-0 flex-col">
                <header className="flex h-14 items-center justify-between border-b px-4">
                    <div className="min-w-0">
                        <p className="truncate font-semibold">
                            {visibleSessions.find(
                                (session) => session.id === activeSessionId
                            )?.title ?? "New chat"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Evidence-backed tariff workspace
                        </p>
                    </div>
                    <ThemeToggle />
                </header>
                <div className="min-h-0 flex-1 overflow-auto">
                    <MessageList
                        isStreaming={isStreaming}
                        messages={displayMessages}
                        onRegenerate={() => {
                            void regenerate();
                        }}
                        streamStatus={streamStatus}
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
            </section>
        </main>
    );
}
