import { updateDocumentMetadata } from "#/server/db/queries/documents";
import {
    insertExtractedFacts,
    insertFeeRules,
    insertTariffRows,
} from "#/server/db/queries/extracted-records";

import type { StructuredExtraction } from "./extractors/schemas";

function statusFromConfidence(confidence: number | null | undefined) {
    return confidence !== null && confidence !== undefined && confidence < 0.7
        ? "needs_review"
        : "extracted";
}

function numericToString(value: number | null | undefined) {
    return value === null || value === undefined ? value : String(value);
}

export async function persistStructuredExtraction(input: {
    documentId: string;
    extraction: StructuredExtraction;
}) {
    const { documentId, extraction } = input;

    await updateDocumentMetadata(documentId, extraction.documentMetadata);
    const [facts, tariffRows, feeRules] = await Promise.all([
        insertExtractedFacts(
            extraction.facts.map((fact) => ({
                ...fact,
                confidence: numericToString(fact.confidence),
                documentId,
                rawEvidence: fact.rawEvidence,
                status: statusFromConfidence(fact.confidence),
                valueNumber: numericToString(fact.valueNumber),
            }))
        ),
        insertTariffRows(
            extraction.tariffRows.map((row) => ({
                ...row,
                confidence: numericToString(row.confidence),
                documentId,
                rawRowText: row.rawRowText,
                status: statusFromConfidence(row.confidence),
            }))
        ),
        insertFeeRules(
            extraction.feeRules.map((rule) => ({
                ...rule,
                documentId,
                minWeightKg: numericToString(rule.minWeightKg),
                ppnPercent: numericToString(rule.ppnPercent),
                status: "extracted" as const,
            }))
        ),
    ]);

    return { facts, feeRules, tariffRows };
}
