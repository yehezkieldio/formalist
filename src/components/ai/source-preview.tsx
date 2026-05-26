"use client";

import { useEffect, useState } from "react";

import { FactDetailCard } from "#/components/ai/fact-detail-card";
import { FeeRuleDetailCard } from "#/components/ai/fee-rule-detail-card";
import { SourcePreviewModal } from "#/components/ai/source-preview-modal";
import { TariffRowDetailCard } from "#/components/ai/tariff-row-detail-card";
import type { ChatSourceCardData } from "#/components/ai/types";

interface SourcePreviewResponse {
    document?: {
        filename?: string;
        sourceName?: string | null;
    } | null;
    evidence: {
        pageNumber?: number | null;
        snippet?: string | null;
        source: Record<string, unknown>;
        sourceType: ChatSourceCardData["sourceType"];
    };
}

function SourceDetail({ detail }: { detail: SourcePreviewResponse }) {
    if (detail.evidence.sourceType === "tariff_row") {
        return <TariffRowDetailCard source={detail.evidence.source} />;
    }

    if (detail.evidence.sourceType === "fee_rule") {
        return <FeeRuleDetailCard source={detail.evidence.source} />;
    }

    if (detail.evidence.sourceType === "extracted_fact") {
        return <FactDetailCard source={detail.evidence.source} />;
    }

    return (
        <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
            {JSON.stringify(detail.evidence.source, null, 2)}
        </pre>
    );
}

export function SourcePreview({
    onClose,
    source,
}: {
    onClose: () => void;
    source: ChatSourceCardData | null;
}) {
    const [detail, setDetail] = useState<SourcePreviewResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!source) {
            setDetail(null);
            setError(null);
            return;
        }

        let active = true;

        const loadSourcePreview = async () => {
            try {
                const response = await fetch(
                    `/api/source/${source.sourceType}/${source.sourceId}`
                );

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const payload =
                    (await response.json()) as SourcePreviewResponse;

                if (active) {
                    setDetail(payload);
                    setError(null);
                }
            } catch (caughtError) {
                if (active) {
                    setDetail(null);
                    setError(
                        caughtError instanceof Error
                            ? caughtError.message
                            : "Source preview failed."
                    );
                }
            }
        };

        void loadSourcePreview();

        return () => {
            active = false;
        };
    }, [source]);

    if (!source) {
        return null;
    }

    return (
        <SourcePreviewModal onClose={onClose} title={source.title}>
            <div className="space-y-4">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 select-none">
                        {detail?.document?.sourceName ??
                            detail?.document?.filename ??
                            source.sourceType}
                        {detail?.evidence.pageNumber
                            ? `, PG ${detail.evidence.pageNumber}`
                            : ""}
                    </p>
                    <div className="mt-3 bg-muted/20 p-3.5 border-l-2 border-foreground text-[11px] leading-relaxed text-foreground select-text font-mono">
                        "
                        {detail?.evidence.snippet ??
                            source.snippet ??
                            "No source snippet stored for this citation."}
                        "
                    </div>
                </div>
                {error ? (
                    <p className="border border-destructive/25 bg-destructive/10 p-3 text-destructive font-mono text-[10px] uppercase tracking-wider">
                        {error}
                    </p>
                ) : null}
                {detail ? <SourceDetail detail={detail} /> : null}
                {source.metadata ? (
                    <div className="space-y-1">
                        <p className="font-mono font-semibold text-muted-foreground/60 text-[9px] uppercase tracking-wider select-none">
                            Metadata Properties
                        </p>
                        <pre className="overflow-auto border border-border/40 bg-background/50 p-2.5 font-mono text-[9px] leading-relaxed text-muted-foreground select-text shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]">
                            {JSON.stringify(source.metadata, null, 2)}
                        </pre>
                    </div>
                ) : null}
            </div>
        </SourcePreviewModal>
    );
}
