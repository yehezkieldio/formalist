import type { UIMessage } from "ai";

function getDirectEvidenceSnippet(record: Record<string, unknown>) {
    if (typeof record.snippet === "string") {
        return [record.snippet];
    }

    if (typeof record.rawEvidence === "string") {
        return [record.rawEvidence];
    }

    if (typeof record.rawRowText === "string") {
        return [record.rawRowText];
    }

    return [];
}

export function extractEvidenceSnippets(value: unknown): string[] {
    if (!value) {
        return [];
    }

    if (typeof value === "string") {
        return value.trim().length > 0 ? [value] : [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) => extractEvidenceSnippets(item));
    }

    if (typeof value !== "object") {
        return [];
    }

    const record = value as Record<string, unknown>;
    const directSnippet = getDirectEvidenceSnippet(record);

    return [
        ...directSnippet,
        ...extractEvidenceSnippets(record.sources),
        ...extractEvidenceSnippets(record.results),
        ...extractEvidenceSnippets(record.evidence),
    ];
}

export function extractMessageEvidenceSnippets(message: UIMessage) {
    return extractEvidenceSnippets(message.parts);
}
