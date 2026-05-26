"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "#/components/ui/button";

export function SourcePreviewModal({
    children,
    onClose,
    title,
}: {
    children: ReactNode;
    onClose: () => void;
    title: string;
}) {
    return (
        <div className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md select-none">
            <dialog
                aria-labelledby="source-preview-title"
                className="fixed inset-x-3 top-8 bottom-8 z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-none border border-border/80 bg-background shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                open
            >
                <header className="flex items-center justify-between gap-3 border-b border-border/40 p-4 bg-muted/10">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[9px] tracking-widest text-muted-foreground/60 uppercase select-none">
                            SOURCE_VIEW //
                        </span>
                        <h2
                            className="truncate font-mono text-xs font-semibold uppercase tracking-wider text-foreground"
                            id="source-preview-title"
                        >
                            {title}
                        </h2>
                    </div>
                    <Button
                        aria-label="Close source preview"
                        onClick={onClose}
                        size="icon"
                        type="button"
                        variant="ghost"
                        className="h-8 w-8 active:scale-95 transition-transform"
                    >
                        <XIcon aria-hidden="true" className="size-4" />
                    </Button>
                </header>
                <div className="min-h-0 flex-1 overflow-auto p-5 select-text leading-relaxed font-sans text-xs">
                    {children}
                </div>
            </dialog>
        </div>
    );
}
