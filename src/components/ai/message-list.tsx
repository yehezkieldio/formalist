"use client";

import { motion } from "motion/react";
import { Streamdown } from "streamdown";

import { ChainOfThought } from "#/components/ai/chain-of-thought";
import { ConfidenceBadge } from "#/components/ai/confidence-badge";
import { EmptyStateExamples } from "#/components/ai/empty-state-examples";
import { MessageActions } from "#/components/ai/message-actions";
import { Reasoning } from "#/components/ai/reasoning";
import { SourceCards } from "#/components/ai/source-cards";
import { TariffAnswerCard } from "#/components/ai/tariff-answer-card";
import { ToolCallTimeline } from "#/components/ai/tool-call-timeline";
import type { FormalistChatMessage } from "#/components/ai/types";
import { cn } from "#/lib/utils";

function getMessageContentClassName(role: FormalistChatMessage["role"]) {
    if (role === "user") {
        return "border border-border/60 bg-muted/10 px-5 py-3 text-foreground rounded-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
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
        if (message.metadata?.tariffAnswer) {
            return (
                <div className="space-y-3">
                    <Streamdown className="prose prose-neutral dark:prose-invert max-w-none">
                        {message.content}
                    </Streamdown>
                    <TariffAnswerCard data={message.metadata.tariffAnswer} />
                </div>
            );
        }

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
        Boolean(message.metadata?.tariffAnswer) ||
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
                        message.verification ? (
                            <div className="flex flex-wrap items-center gap-2 mb-3.5 font-mono text-[9px] select-none border-b border-border/40 pb-2">
                                {message.verification.mode ===
                                "verified_numeric" ? (
                                    <span className="inline-flex items-center gap-1.5 border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-500 font-medium tracking-wider uppercase">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 rounded-full opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                        </span>
                                        VERIFIED NUMERIC MODE
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 border border-border/60 bg-muted/20 px-1.5 py-0.5 text-muted-foreground font-medium tracking-wider uppercase">
                                        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground/45"></span>
                                        RAG RETRIEVAL MODE
                                    </span>
                                )}
                                <ConfidenceBadge
                                    state={message.verification.confidenceState}
                                />
                            </div>
                        ) : null}
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
