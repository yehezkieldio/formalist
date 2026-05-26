import type { tariffRows } from "#/server/db/schema";
import { normalizeAirline } from "#/server/ingestion/normalizers/airline";
import { normalizeValidity } from "#/server/ingestion/normalizers/date";
import { parsePrice } from "#/server/ingestion/normalizers/price";

import { validateLocation } from "./location";
import type { ExtractionIssueDraft } from "./types";

type TariffRowRecord = typeof tariffRows.$inferSelect;

function validateTariffRow(
    documentId: string,
    row: TariffRowRecord
): ExtractionIssueDraft[] {
    const issues: ExtractionIssueDraft[] = [];
    const price = parsePrice(row.smuPricePerKg);
    const airline = normalizeAirline(row.airline);

    for (const issueType of airline.issues) {
        issues.push({
            documentId,
            issueType,
            message:
                issueType === "missing_airline"
                    ? "Tariff row is missing airline."
                    : `Airline is not recognized: ${row.airline ?? "unknown"}.`,
            severity: issueType === "missing_airline" ? "high" : "low",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    }

    if (row.priceStatus === "NA") {
        issues.push({
            documentId,
            issueType: "na_price",
            message: "Tariff row is marked N/A.",
            severity: "medium",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    } else if (row.priceStatus === "MISSING" || price.status === "missing") {
        issues.push({
            documentId,
            issueType: "missing_price",
            message: "Tariff row is missing SMU price.",
            severity: "high",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    } else if (price.status === "invalid") {
        issues.push({
            documentId,
            issueType: "invalid_price_format",
            message: "Tariff row has an invalid SMU price format.",
            severity: "high",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    }

    issues.push(
        ...validateLocation({
            city: row.destinationCity,
            code: row.destinationCode,
            documentId,
            sourceId: row.id,
            sourceType: "tariff_row",
        })
    );

    if (row.confidence !== null && Number(row.confidence) < 0.7) {
        issues.push({
            documentId,
            issueType: "low_extraction_confidence",
            message: "Tariff row confidence is below review threshold.",
            severity: "medium",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    }

    for (const issueType of normalizeValidity(row).issues) {
        issues.push({
            documentId,
            issueType,
            message: `Tariff row validity requires review: ${issueType}.`,
            severity: issueType === "expired_validity" ? "medium" : "high",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    }

    if (!row.rawRowText && !row.sourceText) {
        issues.push({
            documentId,
            issueType: "table_row_source_mismatch",
            message: "Tariff row is missing raw row/source text.",
            severity: "high",
            sourceId: row.id,
            sourceType: "tariff_row",
        });
    }

    return issues;
}

export function validateTariffRows(
    documentId: string,
    rows: TariffRowRecord[]
): ExtractionIssueDraft[] {
    const issues: ExtractionIssueDraft[] = [];

    for (const row of rows) {
        issues.push(...validateTariffRow(documentId, row));
    }

    return issues;
}
