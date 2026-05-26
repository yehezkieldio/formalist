"use client";

import { BrainCircuitIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "#/lib/utils";

export function Reasoning({
    children,
    isStreaming = false,
}: {
    children: string;
    isStreaming?: boolean;
}) {
    const [open, setOpen] = useState(isStreaming);

    useEffect(() => {
        if (isStreaming) {
            setOpen(true);
        }
    }, [isStreaming]);

    if (!children.trim()) {
        return null;
    }

    return (
        <div className="my-2 border-border/70 border-l bg-muted/10 text-xs">
            <button
                className="flex w-full items-center justify-between gap-2 py-1.5 pr-2 pl-2.5 text-left"
                onClick={() => setOpen((value) => !value)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    <BrainCircuitIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate font-medium">Reasoning</span>
                </span>
                <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                    )}
                />
            </button>
            {open ? (
                <div className="border-t px-2.5 py-2 text-muted-foreground leading-5">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
