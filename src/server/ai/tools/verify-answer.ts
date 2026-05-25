import type * as z from "zod";

import type { verifyAnswerInputSchema } from "#/server/ai/tool-schemas";
import type { ConfidenceState } from "#/server/db/schema";

const tokenPattern = /[\p{Letter}\p{Number}]{4,}/gu;

export function findUnsupportedDraftClaims(input: {
    draftText: string;
    evidenceSnippets: string[];
}) {
    const terms = new Set(input.draftText.toLowerCase().match(tokenPattern));
    const evidenceText = input.evidenceSnippets.join("\n").toLowerCase();

    if (terms.size === 0) {
        return [];
    }

    if (evidenceText.trim().length === 0) {
        return ["No retrieved evidence snippets were available."];
    }

    const unsupportedTerms = [...terms].filter(
        (term) => !evidenceText.includes(term)
    );
    const unsupportedRatio = unsupportedTerms.length / terms.size;

    return unsupportedRatio > 0.65
        ? ["Draft answer has low lexical support from retrieved evidence."]
        : [];
}

export function verifyAnswer(input: z.infer<typeof verifyAnswerInputSchema>) {
    const warnings = [
        ...(input.warnings ?? []),
        ...(input.draftText
            ? findUnsupportedDraftClaims({
                  draftText: input.draftText,
                  evidenceSnippets: input.evidenceSnippets ?? [],
              })
            : []),
    ];
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
