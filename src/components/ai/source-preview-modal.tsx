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
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
            <dialog
                aria-labelledby="source-preview-title"
                className="fixed inset-x-3 top-8 bottom-8 z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-lg border bg-background shadow-xl"
                open
            >
                <header className="flex items-center justify-between gap-3 border-b p-4">
                    <h2
                        className="truncate font-semibold"
                        id="source-preview-title"
                    >
                        {title}
                    </h2>
                    <Button
                        aria-label="Close source preview"
                        onClick={onClose}
                        size="icon"
                        type="button"
                        variant="ghost"
                    >
                        <XIcon aria-hidden="true" />
                    </Button>
                </header>
                <div className="min-h-0 flex-1 overflow-auto p-4">
                    {children}
                </div>
            </dialog>
        </div>
    );
}
