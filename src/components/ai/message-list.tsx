"use client";

import { motion } from "motion/react";
import { Streamdown } from "streamdown";

import { ChainOfThought } from "#/components/ai/chain-of-thought";
import { ConfidenceBadge } from "#/components/ai/confidence-badge";
import { EmptyStateExamples } from "#/components/ai/empty-state-examples";
import { MessageActions } from "#/components/ai/message-actions";
import { Reasoning } from "#/components/ai/reasoning";
import { SourceCards } from "#/components/ai/source-cards";
import { ToolCallTimeline } from "#/components/ai/tool-call-timeline";
import type { FormalistChatMessage } from "#/components/ai/types";
import { cn } from "#/lib/utils";

function getMessageContentClassName(role: FormalistChatMessage["role"]) {
    if (role === "user") {
        return "bg-primary px-4 py-3 text-primary-foreground";
    }

    return "w-full max-w-none";
}

function MessageBody({
    isStreaming,
    message,
}: {
    isStreaming: boolean;
    message: FormalistChatMessage;
}) {
    if (!message.content.trim()) {
        if (message.role === "assistant" && !message.toolCalls?.length) {
            if (isStreaming) {
                return (
                    <div className="flex items-center gap-2 py-1 text-muted-foreground">
                        <span className="size-1.5 animate-pulse bg-current" />
                        <span>{message.statusLabel ?? "Working..."}</span>
                    </div>
                );
            }

            return (
                <div className="bg-muted/35 px-4 py-3 text-muted-foreground">
                    No answer text was returned for this response.
                </div>
            );
        }

        return null;
    }

    if (message.role === "assistant") {
        return (
            <Streamdown className="prose prose-neutral dark:prose-invert max-w-none">
                {message.content}
            </Streamdown>
        );
    }

    return <p className="whitespace-pre-wrap">{message.content}</p>;
}

function hasVisibleContent(message: FormalistChatMessage) {
    return (
        message.content.trim().length > 0 ||
        Boolean(message.metadata?.reasoning?.trim()) ||
        Boolean(message.metadata?.steps?.length) ||
        Boolean(message.sources?.length) ||
        Boolean(message.statusLabel?.trim()) ||
        Boolean(message.toolCalls?.length)
    );
}

export function MessageList({
    isStreaming = false,
    messages,
    onRegenerate,
    onSelectExample,
}: {
    isStreaming?: boolean;
    messages: FormalistChatMessage[];
    onRegenerate?: () => void;
    onSelectExample?: (example: string) => void;
}) {
    const lastMessage = messages.at(-1);
    const hasEmptyStreamingAssistant =
        isStreaming &&
        lastMessage?.role === "assistant" &&
        !hasVisibleContent(lastMessage);
    const visibleMessages = hasEmptyStreamingAssistant
        ? messages.slice(0, -1)
        : messages;

    if (visibleMessages.length === 0) {
        return <EmptyStateExamples onSelectExample={onSelectExample} />;
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
            {visibleMessages.map((message, index) => (
                <motion.article
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                        "flex w-full flex-col gap-3",
                        message.role === "user" && "items-end"
                    )}
                    key={message.id}
                >
                    <div
                        className={cn(
                            "max-w-[88%] text-sm leading-7",
                            getMessageContentClassName(message.role)
                        )}
                    >
                        {message.role === "assistant" &&
                        message.metadata?.steps?.length ? (
                            <ChainOfThought steps={message.metadata.steps} />
                        ) : null}
                        <Reasoning isStreaming={isStreaming}>
                            {message.metadata?.reasoning ?? ""}
                        </Reasoning>
                        {message.role === "assistant" ? (
                            <ToolCallTimeline toolCalls={message.toolCalls} />
                        ) : null}
                        <MessageBody
                            isStreaming={isStreaming}
                            message={message}
                        />
                        {message.role === "assistant" &&
                        message.verification ? (
                            <div className="mt-3">
                                <ConfidenceBadge
                                    state={message.verification.confidenceState}
                                />
                            </div>
                        ) : null}
                    </div>
                    {message.role === "assistant" ? (
                        <div className="w-full max-w-4xl space-y-3">
                            <SourceCards sources={message.sources} />
                            {message.content.trim() ? (
                                <MessageActions
                                    content={message.content}
                                    onRegenerate={
                                        index === visibleMessages.length - 1
                                            ? onRegenerate
                                            : undefined
                                    }
                                />
                            ) : null}
                        </div>
                    ) : null}
                </motion.article>
            ))}
        </div>
    );
}
