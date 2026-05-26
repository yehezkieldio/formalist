import type { feeRules, tariffRows } from "#/server/db/schema";

type TariffRowRecord = typeof tariffRows.$inferSelect;
type FeeRuleRecord = typeof feeRules.$inferSelect;

export function tariffRowFixture(
    overrides: Partial<TariffRowRecord> = {}
): TariffRowRecord {
    return {
        airline: "Pelita Air",
        commodity: null,
        confidence: "1",
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
        rawRowText: "Pelita SUB 20000",
        routeType: "DIRECT",
        rowNumber: 1,
        schedule: null,
        smuPricePerKg: 20_000,
        sourceTableChunkId: null,
        sourceText: "Pelita SUB 20000",
        status: "active",
        transitRoute: null,
        updatedAt: new Date("2026-05-01T00:00:00Z"),
        validFrom: "2026-05-01",
        validUntil: "2026-12-31",
        ...overrides,
    };
}

export function feeRuleFixture(
    overrides: Partial<FeeRuleRecord> = {}
): FeeRuleRecord {
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
        status: "active",
        updatedAt: new Date("2026-05-01T00:00:00Z"),
        warehouseAdminPerSmu: null,
        warehouseFeePerKg: null,
        ...overrides,
    };
}
