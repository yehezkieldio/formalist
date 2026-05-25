import { listExtractedRecordsForValidation } from "#/server/db/queries/extracted-records";

import {
    findDuplicateTariffRows,
    findPromoRegularConflicts,
} from "./duplicates";
import { validateExtractedFacts } from "./facts";
import { validateFeeRules } from "./fee-rules";
import {
    deleteExtractionIssuesForDocument,
    insertExtractionIssues,
} from "./issues";
import { validateTariffRows } from "./tariff-rows";

export async function validateExtraction(documentId: string) {
    const records = await listExtractedRecordsForValidation(documentId);
    const issues = [
        ...validateExtractedFacts(documentId, records.facts),
        ...validateTariffRows(documentId, records.tariffRows),
        ...findDuplicateTariffRows(documentId, records.tariffRows),
        ...findPromoRegularConflicts(documentId, records.tariffRows),
        ...validateFeeRules(documentId, records.feeRules),
    ];

    await deleteExtractionIssuesForDocument(documentId);
    const persistedIssues = await insertExtractionIssues(issues);

    return {
        issueCount: persistedIssues.length,
        reviewableRecordCount:
            records.facts.length +
            records.tariffRows.length +
            records.feeRules.length,
    };
}
