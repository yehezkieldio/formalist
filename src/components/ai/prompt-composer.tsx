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

    const updateValue = (nextValue: string) => {
        setValue(nextValue);

        requestAnimationFrame(() => {
            const textarea = textareaRef.current;

            if (!textarea) {
                return;
            }

            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 176)}px`;
        });
    };

    return (
        <form className="border-t bg-background px-3 py-3" onSubmit={submit}>
            <div className="mx-auto flex w-full max-w-4xl items-center gap-2 bg-muted/35 p-2">
                <textarea
                    aria-label="Message"
                    className="max-h-44 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground"
                    disabled={disabled}
                    onChange={(event) => updateValue(event.target.value)}
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
                        className="size-10 self-center"
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
                        className="size-10 self-center"
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
