"use client";

import {
    CheckIcon,
    ChevronDownIcon,
    ClockIcon,
    TerminalIcon,
} from "lucide-react";
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
        <div className="border-border/70 border-l bg-muted/10 text-xs">
            <button
                className="flex w-full items-center justify-between gap-2 py-1.5 pr-2 pl-2.5 text-left"
                onClick={() => setOpen((value) => !value)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    <TerminalIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate font-medium">
                        {toolCall.toolName}
                    </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                    {duration ? (
                        <span className="hidden items-center gap-1 text-muted-foreground sm:flex">
                            <ClockIcon aria-hidden="true" className="size-3" />
                            {duration}
                        </span>
                    ) : null}
                    <Badge
                        className="h-5 rounded-sm px-1.5 font-medium text-[0.6875rem]"
                        variant={
                            toolCall.state === "error"
                                ? "destructive"
                                : "secondary"
                        }
                    >
                        {toolCall.state === "success" ? (
                            <CheckIcon aria-hidden="true" className="size-3" />
                        ) : null}
                        {stateLabels[toolCall.state]}
                    </Badge>
                    <ChevronDownIcon
                        aria-hidden="true"
                        className={cn(
                            "size-3.5 text-muted-foreground transition-transform",
                            open && "rotate-180"
                        )}
                    />
                </span>
            </button>
            {open ? (
                <div className="grid gap-2 border-t px-2.5 py-2">
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
