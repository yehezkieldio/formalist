"use client";

import { ChevronDownIcon, BrainCircuitIcon } from "lucide-react";
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
        <div className="rounded-md border bg-muted/30 text-sm">
            <button
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium"
                onClick={() => setOpen((value) => !value)}
                type="button"
            >
                <span className="flex items-center gap-2">
                    <BrainCircuitIcon aria-hidden="true" className="size-4" />
                    Reasoning
                </span>
                <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                        "size-4 transition-transform",
                        open && "rotate-180"
                    )}
                />
            </button>
            {open ? (
                <div className="border-t px-3 py-2 text-muted-foreground leading-6">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
