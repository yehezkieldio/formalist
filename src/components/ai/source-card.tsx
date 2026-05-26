"use client";

import { FileTextIcon } from "lucide-react";

import type { ChatSourceCardData } from "#/components/ai/types";

export function SourceCard({
    onPreview,
    source,
}: {
    onPreview?: (source: ChatSourceCardData) => void;
    source: ChatSourceCardData;
}) {
    return (
        <div className="border border-border/60 bg-muted/5 p-4 rounded-none font-mono text-[10px] select-text shadow-sm hover:border-foreground/30 hover:bg-muted/10 transition-all duration-300 flex flex-col justify-between h-full">
            <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <FileTextIcon
                            aria-hidden="true"
                            className="size-3.5 shrink-0 text-muted-foreground/60"
                        />
                        <p className="truncate font-semibold uppercase tracking-wider text-foreground text-[10px]">
                            {source.title}
                        </p>
                    </div>
                    {onPreview ? (
                        <button
                            onClick={() => onPreview(source)}
                            type="button"
                            className="font-mono text-[9px] uppercase tracking-wider text-emerald-500 hover:text-emerald-400 hover:underline transition-colors active:scale-95 duration-150 cursor-pointer select-none shrink-0"
                        >
                            [ PREVIEW ]
                        </button>
                    ) : null}
                </div>
                <div>
                    <span className="inline-block font-mono text-[8px] uppercase tracking-wider text-muted-foreground/75 border border-border/40 px-1 py-0.2 bg-muted/20 select-none">
                        {source.sourceType}
                    </span>
                </div>
            </div>
            {source.snippet ? (
                <p className="mt-3.5 line-clamp-2 text-muted-foreground/80 leading-relaxed text-[9.5px] font-sans border-t border-border/40 pt-2.5">
                    {source.snippet}
                </p>
            ) : null}
        </div>
    );
}
