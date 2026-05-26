import type { feeRules } from "#/server/db/schema";

import type { ExtractionIssueDraft } from "./types";

type FeeRuleRecord = typeof feeRules.$inferSelect;

export function validateFeeRules(
    documentId: string,
    rules: FeeRuleRecord[]
): ExtractionIssueDraft[] {
    if (rules.length === 0) {
        return [
            {
                documentId,
                issueType: "missing_fee_rules",
                message: "No fee rules were extracted for this document.",
                severity: "high",
                sourceType: "document",
            },
        ];
    }

    const issues: ExtractionIssueDraft[] = [];

    for (const rule of rules) {
        if (
            rule.adminFeePerSmu === null &&
            rule.warehouseFeePerKg === null &&
            rule.warehouseAdminPerSmu === null &&
            rule.ppnPercent === null
        ) {
            issues.push({
                documentId,
                issueType: "missing_fee_rules",
                message: "Fee rule has no usable fee values.",
                severity: "high",
                sourceId: rule.id,
                sourceType: "fee_rule",
            });
        }

        if (rule.ppnPercent !== null && Number(rule.ppnPercent) < 0) {
            issues.push({
                documentId,
                issueType: "invalid_fee_rule",
                message: "PPN percent cannot be negative.",
                severity: "high",
                sourceId: rule.id,
                sourceType: "fee_rule",
            });
        }
    }

    return issues;
}
