"use client";

import { LoaderCircleIcon, SendIcon, SquareIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { Button } from "#/components/ui/button";

export interface PromptComposerProps {
    disabled?: boolean;
    isStreaming?: boolean;
    onStop?: () => void;
    onSubmit: (content: string) => void;
}

export function PromptComposer({
    disabled = false,
    isStreaming = false,
    onStop,
    onSubmit,
}: PromptComposerProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const content = value.trim();

        if (!content || disabled || isStreaming) {
            return;
        }

        onSubmit(content);
        setValue("");
        textareaRef.current?.focus();
    };

    return (
        <form className="border-t bg-background p-3" onSubmit={submit}>
            <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-lg border bg-card p-2 shadow-sm">
                <textarea
                    aria-label="Message"
                    className="max-h-44 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                    disabled={disabled}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                        }
                    }}
                    placeholder="Ask about prices, routes, fees, documents, or review status..."
                    ref={textareaRef}
                    rows={1}
                    value={value}
                />
                {isStreaming ? (
                    <Button
                        aria-label="Stop generation"
                        onClick={onStop}
                        size="icon"
                        type="button"
                        variant="outline"
                    >
                        <SquareIcon aria-hidden="true" />
                    </Button>
                ) : (
                    <Button
                        aria-label="Send message"
                        disabled={disabled || !value.trim()}
                        size="icon"
                        type="submit"
                    >
                        {disabled ? (
                            <LoaderCircleIcon
                                aria-hidden="true"
                                className="animate-spin"
                            />
                        ) : (
                            <SendIcon aria-hidden="true" />
                        )}
                    </Button>
                )}
            </div>
        </form>
    );
}
