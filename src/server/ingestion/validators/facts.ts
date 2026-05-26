import type { extractedFacts } from "#/server/db/schema";
import { normalizeValidity } from "#/server/ingestion/normalizers/date";

import type { ExtractionIssueDraft } from "./types";

type ExtractedFactRecord = typeof extractedFacts.$inferSelect;

export function validateExtractedFacts(
    documentId: string,
    facts: ExtractedFactRecord[]
): ExtractionIssueDraft[] {
    const issues: ExtractionIssueDraft[] = [];

    for (const fact of facts) {
        if (!fact.rawEvidence) {
            issues.push({
                documentId,
                issueType: "table_row_source_mismatch",
                message: "Extracted fact is missing raw source evidence.",
                severity: "high",
                sourceId: fact.id,
                sourceType: "extracted_fact",
            });
        }

        if (fact.confidence !== null && Number(fact.confidence) < 0.7) {
            issues.push({
                documentId,
                issueType: "low_extraction_confidence",
                message: "Extracted fact confidence is below review threshold.",
                severity: "medium",
                sourceId: fact.id,
                sourceType: "extracted_fact",
            });
        }

        for (const issueType of normalizeValidity(fact).issues) {
            issues.push({
                documentId,
                issueType,
                message: `Fact validity requires review: ${issueType}.`,
                severity: issueType === "expired_validity" ? "medium" : "high",
                sourceId: fact.id,
                sourceType: "extracted_fact",
            });
        }
    }

    return issues;
}
