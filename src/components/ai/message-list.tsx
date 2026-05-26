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
import type {
    ChatStreamStatus,
    ChatToolCallData,
    FormalistChatMessage,
} from "#/components/ai/types";
import { cn } from "#/lib/utils";

function getMessageContentClassName(role: FormalistChatMessage["role"]) {
    if (role === "user") {
        return "bg-primary px-4 py-3 text-primary-foreground";
    }

    return "w-full max-w-none";
}

function MessageBody({ message }: { message: FormalistChatMessage }) {
    if (!message.content.trim()) {
        if (message.role === "assistant") {
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
        Boolean(message.toolCalls?.length)
    );
}

function PendingAssistant({ status }: { status?: ChatStreamStatus }) {
    return (
        <article className="grid w-full gap-3">
            <div className="grid max-w-4xl gap-3 text-sm">
                <div className="flex items-center gap-3 bg-muted/35 px-4 py-3">
                    <span className="size-2 animate-pulse bg-foreground" />
                    <span className="text-muted-foreground">
                        {status?.label ?? "Starting response"}
                    </span>
                </div>
            </div>
        </article>
    );
}

function isAssistantWriting(message: FormalistChatMessage | undefined) {
    return message?.role === "assistant" && message.content.trim().length > 0;
}

function LiveToolCalls({ toolCalls }: { toolCalls?: ChatToolCallData[] }) {
    if (!toolCalls?.length) {
        return null;
    }

    return <ToolCallTimeline toolCalls={toolCalls} />;
}

export function MessageList({
    isStreaming = false,
    liveToolCalls,
    messages,
    onRegenerate,
    onSelectExample,
    streamStatus,
}: {
    isStreaming?: boolean;
    liveToolCalls?: ChatToolCallData[];
    messages: FormalistChatMessage[];
    onRegenerate?: () => void;
    onSelectExample?: (example: string) => void;
    streamStatus?: ChatStreamStatus;
}) {
    const lastMessage = messages.at(-1);
    const hasEmptyStreamingAssistant =
        isStreaming &&
        lastMessage?.role === "assistant" &&
        !hasVisibleContent(lastMessage);
    const visibleMessages = hasEmptyStreamingAssistant
        ? messages.slice(0, -1)
        : messages;
    const visibleLastMessage = visibleMessages.at(-1);
    const showPendingStatus =
        isStreaming && !isAssistantWriting(visibleLastMessage);
    const latestAssistantHasToolCalls = Boolean(
        visibleMessages.findLast((message) => message.role === "assistant")
            ?.toolCalls?.length
    );
    const showLiveToolCalls =
        Boolean(liveToolCalls?.length) &&
        (isStreaming || !latestAssistantHasToolCalls);

    if (visibleMessages.length === 0) {
        return isStreaming ? (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
                <PendingAssistant status={streamStatus} />
            </div>
        ) : (
            <EmptyStateExamples onSelectExample={onSelectExample} />
        );
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
                        <MessageBody message={message} />
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
                            <ToolCallTimeline toolCalls={message.toolCalls} />
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
            {showPendingStatus ? (
                <>
                    <PendingAssistant status={streamStatus} />
                    {showLiveToolCalls ? (
                        <LiveToolCalls toolCalls={liveToolCalls} />
                    ) : null}
                </>
            ) : null}
            {showLiveToolCalls && !showPendingStatus ? (
                <LiveToolCalls toolCalls={liveToolCalls} />
            ) : null}
        </div>
    );
}
