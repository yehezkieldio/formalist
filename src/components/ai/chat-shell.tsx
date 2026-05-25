"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { ConversationSidebar } from "#/components/ai/conversation-sidebar";
import { MessageList } from "#/components/ai/message-list";
import { PromptComposer } from "#/components/ai/prompt-composer";
import type {
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
    const { error, messages, regenerate, sendMessage, status, stop } =
        useChatStream({
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
        <main className="grid h-dvh bg-background text-foreground md:grid-cols-[18rem_minmax(0,1fr)]">
            <ConversationSidebar
                activeSessionId={activeSessionId}
                sessions={sessions}
            />
            <section className="flex min-h-0 flex-col">
                <header className="flex h-14 items-center justify-between border-b px-4">
                    <div className="min-w-0">
                        <p className="truncate font-semibold">
                            {sessions.find(
                                (session) => session.id === activeSessionId
                            )?.title ?? "New chat"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            Agentic RAG with verified numeric mode
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
