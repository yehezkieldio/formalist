import type * as z from "zod";

import type { verifyAnswerInputSchema } from "#/server/ai/tool-schemas";
import type { ConfidenceState } from "#/server/db/schema";

export function verifyAnswer(input: z.infer<typeof verifyAnswerInputSchema>) {
    const warnings = input.warnings ?? [];
    let confidenceState: ConfidenceState = "CONFIDENT";

    if (input.sourceCount === 0) {
        confidenceState = "UNANSWERABLE";
    } else if (
        input.mode === "verified_numeric" &&
        input.trustedSourceCount === 0
    ) {
        confidenceState = "UNVERIFIED";
    } else if (warnings.length > 0) {
        confidenceState = "NEEDS_CONFIRMATION";
    }

    return {
        checks: {
            mode: input.mode,
            sourceCount: input.sourceCount,
            trustedSourceCount: input.trustedSourceCount,
        },
        confidenceState,
        warnings,
    };
}
