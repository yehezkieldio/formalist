"use client";

import type { UIMessage } from "ai";
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function getTextContent(message: UIMessage) {
    return message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
}

function getReasoningText(message: UIMessage) {
    return message.parts
        .filter((part) => part.type === "reasoning")
        .map((part) => part.text)
        .join("");
}

function getToolName(part: UIMessage["parts"][number]) {
    if (part.type === "dynamic-tool") {
        return part.toolName;
    }

    if (part.type.startsWith("tool-")) {
        return part.type.slice("tool-".length);
    }
}

function getToolCallState(part: Record<string, unknown>) {
    if (typeof part.state !== "string") {
        return "pending" as const;
    }

    if (part.state === "output-available") {
        return "success" as const;
    }

    if (part.state === "output-error" || part.state === "output-denied") {
        return "error" as const;
    }

    if (part.state === "input-streaming" || part.state === "input-available") {
        return "running" as const;
    }

    return "pending" as const;
}

function getToolCalls(message: UIMessage): ChatToolCallData[] {
    return message.parts.flatMap((part) => {
        const toolName = getToolName(part);

        if (!toolName || !isRecord(part)) {
            return [];
        }

        const partRecord = part as Record<string, unknown>;
        const state = getToolCallState(partRecord);
        return [
            {
                completedAt: null,
                error:
                    typeof partRecord.errorText === "string"
                        ? partRecord.errorText
                        : undefined,
                id:
                    typeof partRecord.toolCallId === "string"
                        ? partRecord.toolCallId
                        : `${message.id}-${toolName}`,
                input: partRecord.input,
                output: partRecord.output,
                startedAt: "1970-01-01T00:00:00.000Z",
                state,
                toolName,
            },
        ];
    });
}

function mergeMessages(
    persistedMessages: FormalistChatMessage[],
    uiMessages: ReturnType<typeof useChatStream>["messages"]
) {
    const persistedById = new Map(
        persistedMessages.map((message) => [message.id, message])
    );

    return uiMessages.map<FormalistChatMessage>((message) => {
        const persisted = persistedById.get(message.id);
        const content = getTextContent(message);
        const reasoning = getReasoningText(message);
        const liveToolCalls = getToolCalls(message);
        const metadata =
            typeof message.metadata === "object" && message.metadata
                ? (message.metadata as FormalistChatMessage["metadata"])
                : null;
        const mergedMetadata =
            reasoning.trim().length > 0
                ? {
                      ...(persisted?.metadata ?? metadata),
                      reasoning,
                  }
                : (persisted?.metadata ?? metadata);

        return {
            content: content || persisted?.content || "",
            id: message.id,
            metadata: mergedMetadata,
            parts: message.parts,
            role: message.role,
            sources: persisted?.sources,
            toolCalls: persisted?.toolCalls?.length
                ? persisted.toolCalls
                : liveToolCalls,
            verification: persisted?.verification,
        };
    });
}

function appendStreamingPlaceholder(
    messages: FormalistChatMessage[],
    input: {
        isStreaming: boolean;
        statusLabel?: string;
        toolCalls: ChatToolCallData[];
    }
) {
    if (!(input.isStreaming || input.toolCalls.length > 0)) {
        return messages;
    }

    const lastMessage = messages.at(-1);

    if (lastMessage?.role === "assistant") {
        return messages.map((message, index) =>
            index === messages.length - 1
                ? {
                      ...message,
                      statusLabel:
                          !message.content.trim() && !message.toolCalls?.length
                              ? (input.statusLabel ?? "Working...")
                              : message.statusLabel,
                      toolCalls: message.toolCalls?.length
                          ? message.toolCalls
                          : input.toolCalls,
                  }
                : message
        );
    }

    if (!input.isStreaming) {
        return messages;
    }

    return [
        ...messages,
        {
            content: "",
            id: "streaming-assistant-placeholder",
            role: "assistant" as const,
            statusLabel: input.statusLabel ?? "Working...",
            toolCalls: input.toolCalls,
        },
    ];
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
    const stickToBottomRef = useRef(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [visibleSessions, setVisibleSessions] = useState(sessions);
    const {
        error,
        messages,
        regenerate,
        sendMessage,
        status,
        streamStatus,
        streamToolCalls,
        stop,
    } = useChatStream({
        initialMessages,
        onFinish: () => router.refresh(),
        sessionId: activeSessionId,
    });
    const isStreaming = status === "streaming" || status === "submitted";
    const displayMessages = useMemo(
        () =>
            appendStreamingPlaceholder(
                mergeMessages(initialMessages, messages),
                {
                    isStreaming,
                    statusLabel: streamStatus?.label,
                    toolCalls: streamToolCalls,
                }
            ),
        [
            initialMessages,
            isStreaming,
            messages,
            streamStatus?.label,
            streamToolCalls,
        ]
    );

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;

        if (!scrollArea) {
            return;
        }

        if (!stickToBottomRef.current) {
            return;
        }

        const animationFrame = requestAnimationFrame(() => {
            scrollArea.scrollTo({
                behavior: "auto",
                top: scrollArea.scrollHeight,
            });
        });

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [displayMessages]);

    const submitMessage = (content: string) => {
        void sendMessage({
            id: crypto.randomUUID(),
            parts: [{ text: content, type: "text" }],
            role: "user",
        });
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
                className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
            >
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase select-none">
                            SESSION //
                        </span>
                        <h1 className="truncate font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                            {visibleSessions.find(
                                (session) => session.id === activeSessionId
                            )?.title ?? "New chat"}
                        </h1>
                    </div>
                    <ThemeToggle />
                </header>
                <div
                    ref={scrollAreaRef}
                    className="min-h-0 flex-1 overflow-auto"
                    onScroll={(event) => {
                        const element = event.currentTarget;
                        const distanceFromBottom =
                            element.scrollHeight -
                            element.scrollTop -
                            element.clientHeight;
                        stickToBottomRef.current = distanceFromBottom < 120;
                    }}
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
