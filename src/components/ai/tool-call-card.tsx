"use client";

import {
    CheckIcon,
    ChevronDownIcon,
    ClockIcon,
    TerminalIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type { ChatToolCallData } from "#/components/ai/types";
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
        <div className="space-y-1">
            <p className="font-semibold text-muted-foreground/60 text-[9px] uppercase tracking-wider">
                {label}
            </p>
            <pre className="max-h-52 overflow-auto border border-border/40 bg-background/50 p-2.5 font-mono text-[9px] leading-relaxed text-muted-foreground select-text shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]">
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
        <div className="border-l-2 border-border/60 bg-muted/5 font-mono text-[10px] select-text">
            <button
                className="flex w-full items-center justify-between gap-2 py-2 pr-2.5 pl-3 text-left hover:bg-muted/10 transition-colors duration-200 select-none cursor-pointer"
                onClick={() => setOpen((value) => !value)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    <TerminalIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground/75"
                    />
                    <span className="truncate font-semibold text-foreground/90 uppercase tracking-wider">
                        {toolCall.toolName}
                    </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                    {duration ? (
                        <span className="hidden items-center gap-1 text-muted-foreground/50 text-[9px] sm:flex font-medium">
                            <ClockIcon
                                aria-hidden="true"
                                className="size-2.5"
                            />
                            {duration}
                        </span>
                    ) : null}
                    {toolCall.state === "success" && (
                        <span className="inline-flex items-center gap-0.5 border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase text-emerald-500">
                            <CheckIcon
                                aria-hidden="true"
                                className="size-2.5"
                            />
                            {stateLabels.success}
                        </span>
                    )}
                    {toolCall.state === "error" && (
                        <span className="inline-flex items-center gap-0.5 border border-destructive/25 bg-destructive/10 px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase text-destructive">
                            {stateLabels.error}
                        </span>
                    )}
                    {toolCall.state === "running" && (
                        <span className="inline-flex items-center gap-1.5 border border-foreground/15 bg-muted/20 px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase text-foreground/80 animate-pulse">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full bg-foreground/30 rounded-full opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground/60"></span>
                            </span>
                            {stateLabels.running}
                        </span>
                    )}
                    {toolCall.state === "pending" && (
                        <span className="inline-flex items-center border border-border bg-card px-1.5 py-0.5 text-[8px] font-semibold tracking-wider uppercase text-muted-foreground">
                            {stateLabels.pending}
                        </span>
                    )}
                    <ChevronDownIcon
                        aria-hidden="true"
                        className={cn(
                            "size-3.5 text-muted-foreground/60 transition-transform duration-300",
                            open && "rotate-180"
                        )}
                    />
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            damping: 20,
                            stiffness: 180,
                            type: "spring",
                        }}
                        className="overflow-hidden"
                    >
                        <div className="grid gap-3 border-t border-border/40 px-3 py-3 bg-background/5">
                            <JsonBlock
                                label="Input Parameters"
                                value={toolCall.input}
                            />
                            <JsonBlock
                                label="Response Output"
                                value={toolCall.output}
                            />
                            {toolCall.error ? (
                                <div className="border border-destructive/25 bg-destructive/10 p-2.5 text-destructive text-[9px] leading-normal font-semibold uppercase tracking-wide">
                                    ERROR: {toolCall.error}
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
