import { describe, expect, it } from "vitest";

import type { feeRules, tariffRows } from "#/server/db/schema";
import {
    findDuplicateTariffRows,
    findPromoRegularConflicts,
} from "#/server/ingestion/validators/duplicates";
import { validateFeeRules } from "#/server/ingestion/validators/fee-rules";
import { toIssueInsertValues } from "#/server/ingestion/validators/issues";
import { validateLocation } from "#/server/ingestion/validators/location";
import { validateTariffRows } from "#/server/ingestion/validators/tariff-rows";

type TariffRowRecord = typeof tariffRows.$inferSelect;
type FeeRuleRecord = typeof feeRules.$inferSelect;

function tariffRow(overrides: Partial<TariffRowRecord> = {}): TariffRowRecord {
    return {
        airline: "Pelita Air",
        commodity: null,
        confidence: "0.9",
        createdAt: new Date("2026-05-01T00:00:00Z"),
        destinationCity: "Surabaya",
        destinationCode: "SUB",
        documentId: "doc-1",
        effectiveDate: "2026-05-01",
        flightNumber: null,
        id: "row-1",
        isPromo: false,
        originAirport: "BPN",
        originCity: "Balikpapan",
        pageNumber: 1,
        priceStatus: "NUMERIC",
        rawRowText: "Pelita SUB 18000",
        routeType: "DIRECT",
        rowNumber: 1,
        schedule: null,
        smuPricePerKg: 18_000,
        sourceTableChunkId: null,
        sourceText: "Pelita SUB 18000",
        status: "extracted",
        transitRoute: null,
        updatedAt: new Date("2026-05-01T00:00:00Z"),
        validFrom: "2026-05-01",
        validUntil: "2026-05-31",
        ...overrides,
    };
}

function feeRule(overrides: Partial<FeeRuleRecord> = {}): FeeRuleRecord {
    return {
        adminFeePerSmu: 10_000,
        airline: "Pelita Air",
        createdAt: new Date("2026-05-01T00:00:00Z"),
        dgSurcharge: null,
        documentId: "doc-1",
        id: "fee-1",
        minWeightKg: "10",
        notes: null,
        ppnPercent: "11",
        quarantineNote: null,
        shipdecNote: null,
        sourceChunkId: null,
        sourceTableChunkId: null,
        status: "extracted",
        updatedAt: new Date("2026-05-01T00:00:00Z"),
        warehouseAdminPerSmu: null,
        warehouseFeePerKg: null,
        ...overrides,
    };
}

describe("extraction validators", () => {
    it("detects tariff row issues, duplicates, and promo/regular conflicts", () => {
        const rows = [
            tariffRow({ id: "row-1", isPromo: true }),
            tariffRow({ id: "row-2", isPromo: true }),
            tariffRow({
                destinationCity: "Surabaya",
                destinationCode: "UPG",
                id: "row-3",
                priceStatus: "MISSING",
                rawRowText: null,
                smuPricePerKg: null,
                sourceText: null,
            }),
        ];

        const rowIssues = validateTariffRows("doc-1", rows);
        const duplicateIssues = findDuplicateTariffRows("doc-1", rows);
        const conflictIssues = findPromoRegularConflicts("doc-1", [
            tariffRow({ id: "row-4", isPromo: false }),
            tariffRow({ id: "row-5", isPromo: true }),
        ]);

        expect(rowIssues.map((issue) => issue.issueType)).toEqual(
            expect.arrayContaining([
                "city_code_mismatch",
                "missing_price",
                "table_row_source_mismatch",
            ])
        );
        expect(duplicateIssues).toEqual([
            expect.objectContaining({
                issueType: "duplicate_row",
                sourceId: "row-2",
            }),
        ]);
        expect(conflictIssues).toEqual([
            expect.objectContaining({
                issueType: "conflicting_promo_regular_facts",
                sourceId: "row-5",
            }),
        ]);
    });

    it("detects ambiguous location aliases", () => {
        expect(
            validateLocation({
                city: "Jogja",
                documentId: "doc-1",
                sourceId: "row-1",
                sourceType: "tariff_row",
            })
        ).toEqual([
            expect.objectContaining({
                issueType: "ambiguous_destination_alias",
                severity: "medium",
            }),
        ]);
    });

    it("detects missing fees and maps issue inserts to open status", () => {
        expect(validateFeeRules("doc-1", [])).toEqual([
            expect.objectContaining({
                issueType: "missing_fee_rules",
                severity: "high",
            }),
        ]);
        expect(
            validateFeeRules("doc-1", [
                feeRule({
                    adminFeePerSmu: null,
                    ppnPercent: null,
                    warehouseAdminPerSmu: null,
                    warehouseFeePerKg: null,
                }),
            ])
        ).toEqual([
            expect.objectContaining({
                issueType: "missing_fee_rules",
                sourceId: "fee-1",
            }),
        ]);

        expect(
            toIssueInsertValues([
                {
                    documentId: "doc-1",
                    issueType: "missing_price",
                    message: "Missing price",
                    severity: "high",
                    sourceId: "row-1",
                    sourceType: "tariff_row",
                },
            ])
        ).toEqual([
            expect.objectContaining({
                status: "open",
            }),
        ]);
    });
});
