import type { tariffRows } from "#/server/db/schema";

import type { ExtractionIssueDraft } from "./types";

type TariffRowRecord = typeof tariffRows.$inferSelect;

function rowKey(row: TariffRowRecord) {
    return [
        row.airline ?? "",
        row.destinationCity ?? "",
        row.destinationCode ?? "",
        row.routeType,
        row.validFrom ?? "",
        row.validUntil ?? "",
        row.isPromo ? "promo" : "regular",
    ].join("|");
}

function promoConflictKey(row: TariffRowRecord) {
    return [
        row.airline ?? "",
        row.destinationCity ?? "",
        row.destinationCode ?? "",
        row.routeType,
        row.validFrom ?? "",
        row.validUntil ?? "",
    ].join("|");
}

export function findDuplicateTariffRows(
    documentId: string,
    rows: TariffRowRecord[]
): ExtractionIssueDraft[] {
    const seen = new Map<string, TariffRowRecord>();
    const issues: ExtractionIssueDraft[] = [];

    for (const row of rows) {
        const key = rowKey(row);
        const previous = seen.get(key);

        if (previous) {
            issues.push({
                documentId,
                issueType: "duplicate_row",
                message: `Duplicate tariff row matches row ${previous.id}.`,
                severity: "medium",
                sourceId: row.id,
                sourceType: "tariff_row",
            });
            continue;
        }

        seen.set(key, row);
    }

    return issues;
}

export function findPromoRegularConflicts(
    documentId: string,
    rows: TariffRowRecord[]
): ExtractionIssueDraft[] {
    const grouped = new Map<string, Set<boolean>>();
    const issues: ExtractionIssueDraft[] = [];

    for (const row of rows) {
        const key = promoConflictKey(row);
        const flags = grouped.get(key) ?? new Set<boolean>();
        flags.add(row.isPromo);
        grouped.set(key, flags);

        if (flags.size > 1) {
            issues.push({
                documentId,
                issueType: "conflicting_promo_regular_facts",
                message:
                    "Promo and regular tariff rows both match the same route and validity.",
                severity: "medium",
                sourceId: row.id,
                sourceType: "tariff_row",
            });
        }
    }

    return issues;
}
