"use client";

import { ChevronDownIcon, ClockIcon, TerminalSquareIcon } from "lucide-react";
import { useState } from "react";

import type { ChatToolCallData } from "#/components/ai/types";
import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

const stateLabels = {
    error: "Error",
    pending: "Pending",
    running: "Running",
    success: "Success",
} as const;

function JsonBlock({ label, value }: { label: string; value: unknown }) {
    if (value === null || value === undefined) {
        return null;
    }

    return (
        <div>
            <p className="mb-1 font-medium">{label}</p>
            <pre className="max-h-52 overflow-auto rounded-md bg-background p-2 text-muted-foreground">
                {JSON.stringify(value, null, 2)}
            </pre>
        </div>
    );
}

function formatDuration(toolCall: ChatToolCallData) {
    if (!toolCall.completedAt) {
        return null;
    }

    const started = new Date(toolCall.startedAt).getTime();
    const completed = new Date(toolCall.completedAt).getTime();
    const duration = Math.max(0, completed - started);
    return `${duration} ms`;
}

export function ToolCallCard({ toolCall }: { toolCall: ChatToolCallData }) {
    const [open, setOpen] = useState(false);
    const duration = formatDuration(toolCall);

    return (
        <div className="rounded-md border bg-muted/20">
            <button
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                onClick={() => setOpen((value) => !value)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <TerminalSquareIcon
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                    <span className="truncate font-medium text-sm">
                        {toolCall.toolName}
                    </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                    {duration ? (
                        <span className="hidden items-center gap-1 text-muted-foreground text-xs sm:flex">
                            <ClockIcon aria-hidden="true" className="size-3" />
                            {duration}
                        </span>
                    ) : null}
                    <Badge
                        variant={
                            toolCall.state === "error"
                                ? "destructive"
                                : "secondary"
                        }
                    >
                        {stateLabels[toolCall.state]}
                    </Badge>
                    <ChevronDownIcon
                        aria-hidden="true"
                        className={cn(
                            "size-4 transition-transform",
                            open && "rotate-180"
                        )}
                    />
                </span>
            </button>
            {open ? (
                <div className="grid gap-2 border-t p-3 text-xs">
                    <JsonBlock label="Input" value={toolCall.input} />
                    <JsonBlock label="Output" value={toolCall.output} />
                    {toolCall.error ? (
                        <p className="text-destructive">{toolCall.error}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
