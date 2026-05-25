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
                    <p className="text-muted-foreground text-sm">
                        {detail?.document?.sourceName ??
                            detail?.document?.filename ??
                            source.sourceType}
                        {detail?.evidence.pageNumber
                            ? `, page ${detail.evidence.pageNumber}`
                            : ""}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                        {detail?.evidence.snippet ??
                            source.snippet ??
                            "No source snippet stored for this citation."}
                    </p>
                </div>
                {error ? (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                        {error}
                    </p>
                ) : null}
                {detail ? <SourceDetail detail={detail} /> : null}
                {source.metadata ? (
                    <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                        {JSON.stringify(source.metadata, null, 2)}
                    </pre>
                ) : null}
            </div>
        </SourcePreviewModal>
    );
}
