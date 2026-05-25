import {
    AlertTriangleIcon,
    CheckCircle2Icon,
    HelpCircleIcon,
} from "lucide-react";

import { Badge } from "#/components/ui/badge";
import type { ConfidenceState } from "#/server/db/schema";

const confidenceLabels = {
    CONFIDENT: "Confident",
    NEEDS_CONFIRMATION: "Needs confirmation",
    UNANSWERABLE: "Unanswerable",
    UNVERIFIED: "Unverified",
} satisfies Record<ConfidenceState, string>;

function getConfidenceIcon(state: ConfidenceState) {
    if (state === "CONFIDENT") {
        return CheckCircle2Icon;
    }

    if (state === "UNANSWERABLE") {
        return HelpCircleIcon;
    }

    return AlertTriangleIcon;
}

export function ConfidenceBadge({ state }: { state: ConfidenceState }) {
    const Icon = getConfidenceIcon(state);
    const variant = state === "CONFIDENT" ? "secondary" : "outline";

    return (
        <Badge className="gap-1" variant={variant}>
            <Icon aria-hidden="true" className="size-3" />
            {confidenceLabels[state]}
        </Badge>
    );
}
