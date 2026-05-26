"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { ToolCallCard } from "#/components/ai/tool-call-card";
import type { ChatToolCallData } from "#/components/ai/types";
import { cn } from "#/lib/utils";

const visibleToolCallCount = 3;

export function ToolCallTimeline({
    toolCalls,
}: {
    toolCalls?: ChatToolCallData[];
}) {
    const [expanded, setExpanded] = useState(false);

    if (!toolCalls?.length) {
        return null;
    }

    const hiddenToolCalls = toolCalls.slice(0, -visibleToolCallCount);
    const visibleToolCalls = expanded
        ? toolCalls
        : toolCalls.slice(-visibleToolCallCount);
    const hiddenCount = hiddenToolCalls.length;

    return (
        <div className="my-2 space-y-1.5">
            {hiddenCount > 0 ? (
                <button
                    className="flex w-full items-center justify-between border-border/70 border-l bg-muted/5 py-1 pr-2 pl-2.5 text-left text-muted-foreground text-xs transition-colors hover:bg-muted/15 hover:text-foreground"
                    onClick={() => setExpanded((value) => !value)}
                    type="button"
                >
                    <span>
                        {expanded
                            ? "Hide earlier tool calls"
                            : `${hiddenCount} earlier tool call${hiddenCount === 1 ? "" : "s"}`}
                    </span>
                    <ChevronDownIcon
                        aria-hidden="true"
                        className={cn(
                            "size-3.5 transition-transform",
                            expanded && "rotate-180"
                        )}
                    />
                </button>
            ) : null}
            {visibleToolCalls.map((toolCall) => (
                <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
        </div>
    );
}
