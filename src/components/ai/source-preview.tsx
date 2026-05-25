"use client";

import { XIcon } from "lucide-react";

import type { ChatSourceCardData } from "#/components/ai/types";
import { Button } from "#/components/ui/button";

export function SourcePreview({
    onClose,
    source,
}: {
    onClose: () => void;
    source: ChatSourceCardData | null;
}) {
    if (!source) {
        return null;
    }

    return (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l bg-background shadow-xl sm:w-[420px]">
            <header className="flex items-center justify-between gap-3 border-b p-4">
                <div className="min-w-0">
                    <p className="truncate font-semibold">{source.title}</p>
                    <p className="text-muted-foreground text-xs">
                        {source.sourceType}
                    </p>
                </div>
                <Button
                    aria-label="Close source preview"
                    onClick={onClose}
                    size="icon"
                    variant="ghost"
                >
                    <XIcon aria-hidden="true" />
                </Button>
            </header>
            <div className="flex-1 overflow-auto p-4">
                <p className="whitespace-pre-wrap text-sm leading-7">
                    {source.snippet ??
                        "No source snippet stored for this citation."}
                </p>
                {source.metadata ? (
                    <pre className="mt-4 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                        {JSON.stringify(source.metadata, null, 2)}
                    </pre>
                ) : null}
            </div>
        </aside>
    );
}
