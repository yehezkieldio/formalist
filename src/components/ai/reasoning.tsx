"use client";

import { BrainCircuitIcon, ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
        <div className="my-3 border-l-2 border-border/60 bg-muted/5 font-mono text-[10px] select-text">
            <button
                className="flex w-full items-center justify-between gap-2 py-2 pr-2.5 pl-3 text-left hover:bg-muted/10 transition-colors duration-200 select-none cursor-pointer"
                onClick={() => setOpen((value) => !value)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    <BrainCircuitIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-muted-foreground/75"
                    />
                    <span className="truncate font-semibold uppercase tracking-wider text-muted-foreground">
                        Thinking Process
                    </span>
                </span>
                <ChevronDownIcon
                    aria-hidden="true"
                    className={cn(
                        "size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-300",
                        open && "rotate-180"
                    )}
                />
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
                        <div className="max-h-56 overflow-y-auto border-t border-border/40 px-3 py-2 text-muted-foreground/80 leading-relaxed sm:max-h-72 whitespace-pre-wrap">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
