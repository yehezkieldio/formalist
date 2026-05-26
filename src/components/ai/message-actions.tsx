"use client";

import { CheckIcon, CopyIcon, RefreshCcwIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";

export interface MessageActionsProps {
    content: string;
    onRegenerate?: () => void;
}

export function MessageActions({ content, onRegenerate }: MessageActionsProps) {
    const [copied, setCopied] = useState(false);

    const copyMessage = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
    };

    return (
        <div className="flex items-center gap-1 pt-1">
            <Button
                aria-label="Copy message"
                onClick={copyMessage}
                size="icon-xs"
                type="button"
                variant="ghost"
            >
                {copied ? (
                    <CheckIcon aria-hidden="true" />
                ) : (
                    <CopyIcon aria-hidden="true" />
                )}
            </Button>
            {onRegenerate ? (
                <Button
                    aria-label="Regenerate response"
                    onClick={onRegenerate}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                >
                    <RefreshCcwIcon aria-hidden="true" />
                </Button>
            ) : null}
        </div>
    );
}
