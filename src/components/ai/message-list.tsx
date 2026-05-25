"use client";

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

function MessageBody({ message }: { message: FormalistChatMessage }) {
    if (!message.content) {
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

export function MessageList({
    isStreaming = false,
    messages,
    onRegenerate,
}: {
    isStreaming?: boolean;
    messages: FormalistChatMessage[];
    onRegenerate?: () => void;
}) {
    if (messages.length === 0) {
        return <EmptyStateExamples />;
    }

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
            {messages.map((message, index) => (
                <article
                    className={cn(
                        "flex w-full flex-col gap-3",
                        message.role === "user" && "items-end"
                    )}
                    key={message.id}
                >
                    <div
                        className={cn(
                            "max-w-[88%] rounded-md text-sm leading-7",
                            getMessageContentClassName(message.role)
                        )}
                    >
                        {message.role === "assistant" &&
                        message.verification ? (
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <ConfidenceBadge
                                    state={message.verification.confidenceState}
                                />
                                <span className="text-muted-foreground text-xs">
                                    {message.verification.mode}
                                </span>
                            </div>
                        ) : null}
                        <ChainOfThought steps={message.metadata?.steps} />
                        <Reasoning isStreaming={isStreaming}>
                            {message.metadata?.reasoning ?? ""}
                        </Reasoning>
                        <MessageBody message={message} />
                    </div>
                    {message.role === "assistant" ? (
                        <div className="w-full max-w-4xl space-y-3">
                            <ToolCallTimeline toolCalls={message.toolCalls} />
                            <SourceCards sources={message.sources} />
                            <MessageActions
                                content={message.content}
                                onRegenerate={
                                    index === messages.length - 1
                                        ? onRegenerate
                                        : undefined
                                }
                            />
                        </div>
                    ) : null}
                </article>
            ))}
        </div>
    );
}
