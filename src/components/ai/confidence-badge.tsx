import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

import type { ConfidenceState } from "#/server/db/schema";

const confidenceLabels = {
    CONFIDENT: "Confident",
    NEEDS_CONFIRMATION: "Needs confirmation",
    UNVERIFIED: "Unverified",
} satisfies Partial<Record<ConfidenceState, string>>;

function getConfidenceIcon(state: ConfidenceState) {
    if (state === "CONFIDENT") {
        return CheckCircle2Icon;
    }

    return AlertTriangleIcon;
}

export function ConfidenceBadge({ state }: { state: ConfidenceState }) {
    if (state === "UNANSWERABLE") {
        return null;
    }

    const Icon = getConfidenceIcon(state);

    if (state === "CONFIDENT") {
        return (
            <span className="inline-flex items-center gap-1 border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider uppercase text-emerald-500">
                <Icon aria-hidden="true" className="size-2.5" />
                {confidenceLabels[state]}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider uppercase text-amber-500">
            <Icon aria-hidden="true" className="size-2.5" />
            {confidenceLabels[state]}
        </span>
    );
}
