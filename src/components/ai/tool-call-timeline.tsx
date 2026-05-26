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
        <div className="my-3 space-y-1">
            {hiddenCount > 0 ? (
                <button
                    className="flex w-full items-center justify-between border-l-2 border-border/60 bg-muted/5 py-1.5 pr-2.5 pl-3 text-left text-muted-foreground/60 font-mono text-[9px] uppercase tracking-wider transition-colors hover:bg-muted/15 hover:text-foreground duration-200 cursor-pointer select-none"
                    onClick={() => setExpanded((value) => !value)}
                    type="button"
                >
                    <span>
                        {expanded
                            ? "Hide earlier tool executions"
                            : `${hiddenCount} earlier tool execution${hiddenCount === 1 ? "" : "s"}`}
                    </span>
                    <ChevronDownIcon
                        aria-hidden="true"
                        className={cn(
                            "size-3.5 transition-transform duration-300",
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
