"use client";

import { FileTextIcon } from "lucide-react";

import type { ChatSourceCardData } from "#/components/ai/types";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";

export function SourceCard({
    onPreview,
    source,
}: {
    onPreview?: (source: ChatSourceCardData) => void;
    source: ChatSourceCardData;
}) {
    return (
        <div className="rounded-md border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <FileTextIcon
                            aria-hidden="true"
                            className="size-4 shrink-0"
                        />
                        <p className="truncate font-medium text-sm">
                            {source.title}
                        </p>
                    </div>
                    <Badge className="mt-2" variant="outline">
                        {source.sourceType}
                    </Badge>
                </div>
                {onPreview ? (
                    <Button
                        onClick={() => onPreview(source)}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        Preview
                    </Button>
                ) : null}
            </div>
            {source.snippet ? (
                <p className="mt-3 line-clamp-3 text-muted-foreground text-sm leading-6">
                    {source.snippet}
                </p>
            ) : null}
        </div>
    );
}
