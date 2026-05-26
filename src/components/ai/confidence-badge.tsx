import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

import { Badge } from "#/components/ui/badge";
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
    const variant = state === "CONFIDENT" ? "secondary" : "outline";

    return (
        <Badge className="gap-1" variant={variant}>
            <Icon aria-hidden="true" className="size-3" />
            {confidenceLabels[state]}
        </Badge>
    );
}
