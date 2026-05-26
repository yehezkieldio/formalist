"use client";

import { useState } from "react";

import { SourceCard } from "#/components/ai/source-card";
import { SourcePreview } from "#/components/ai/source-preview";
import type { ChatSourceCardData } from "#/components/ai/types";

export function SourceCards({ sources }: { sources?: ChatSourceCardData[] }) {
    const [preview, setPreview] = useState<ChatSourceCardData | null>(null);

    if (!sources?.length) {
        return null;
    }

    return (
        <>
            <div className="grid gap-2 sm:grid-cols-2">
                {sources.map((source) => (
                    <SourceCard
                        key={source.id}
                        onPreview={setPreview}
                        source={source}
                    />
                ))}
            </div>
            <SourcePreview onClose={() => setPreview(null)} source={preview} />
        </>
    );
}
