"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";

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

    const isSendDisabled = disabled || !value.trim();

    return (
        <form
            className="border-t border-border/40 bg-background/80 px-6 py-5 backdrop-blur-md"
            onSubmit={submit}
        >
            <div className="mx-auto flex w-full max-w-3xl items-center gap-2 border border-border/60 bg-muted/5 p-2 px-3 transition-all duration-300 focus-within:border-foreground/45 focus-within:bg-background shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] rounded-none">
                <textarea
                    aria-label="Message"
                    className="max-h-44 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-xs leading-relaxed outline-none placeholder:text-muted-foreground/45 font-sans"
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

                <div className="flex shrink-0 items-center self-end px-1 pb-1">
                    {isStreaming ? (
                        <button
                            aria-label="Stop generation"
                            className="flex size-8 cursor-pointer items-center justify-center border border-border/60 bg-card text-foreground transition-all hover:bg-muted active:scale-95 rounded-none shadow-sm select-none"
                            onClick={onStop}
                            type="button"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="size-3.5"
                                aria-hidden="true"
                            >
                                <rect x="4" y="4" width="16" height="16" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            aria-label="Send message"
                            className="flex size-8 cursor-pointer items-center justify-center bg-foreground text-background transition-all hover:bg-foreground/85 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/40 active:scale-95 rounded-none shadow-sm select-none"
                            disabled={isSendDisabled}
                            type="submit"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="size-4"
                                aria-hidden="true"
                            >
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <p className="pt-4 text-center font-mono text-[9px] tracking-widest text-muted-foreground/40 uppercase select-none">
                Formalist v{process.env.NEXT_PUBLIC_APP_VERSION} // (
                {process.env.NEXT_PUBLIC_GIT_COMMIT_HASH})
            </p>
        </form>
    );
}
