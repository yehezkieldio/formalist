import { normalizeCityCode } from "#/server/ingestion/normalizers/city-code";

import type { ExtractionIssueDraft } from "./types";

function locationIssueMessage(
    issueType: string,
    input: { city?: string | null; code?: string | null }
) {
    if (issueType === "city_code_mismatch") {
        return `Destination city/code appears mismatched: ${input.city ?? "unknown"} / ${input.code ?? "unknown"}.`;
    }

    if (issueType === "ambiguous_destination_alias") {
        return `Destination alias is ambiguous: ${input.city ?? input.code ?? "unknown"}.`;
    }

    if (issueType === "missing_destination") {
        return "Destination city and airport code are missing.";
    }

    return `Destination could not be resolved: ${input.city ?? input.code ?? "unknown"}.`;
}

export function validateLocation(input: {
    city?: string | null;
    code?: string | null;
    documentId: string;
    sourceId?: string | null;
    sourceType: string;
}): ExtractionIssueDraft[] {
    const result = normalizeCityCode({
        city: input.city,
        code: input.code,
    });

    return result.issues.map((issueType) => ({
        documentId: input.documentId,
        issueType,
        message: locationIssueMessage(issueType, input),
        severity:
            issueType === "city_code_mismatch" ||
            issueType === "missing_destination"
                ? "high"
                : "medium",
        sourceId: input.sourceId,
        sourceType: input.sourceType,
    }));
}
