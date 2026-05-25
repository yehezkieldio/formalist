import { describe, expect, it } from "vitest";

import { structuredExtractionSchema } from "#/server/ingestion/extractors/schemas";

describe("structured extraction schemas", () => {
    it("accepts document metadata, facts, tariff rows, fee rules, confidence, and evidence", () => {
        const result = structuredExtractionSchema.safeParse({
            documentMetadata: {
                airline: "Pelita Air",
                commodity: "General cargo",
                confidence: 0.92,
                effectiveDate: "2026-05-01",
                isPromo: false,
                originAirport: "BPN",
                originCity: "Balikpapan",
                validFrom: "2026-05-01",
                validUntil: "2026-05-31",
            },
            facts: [
                {
                    airline: "Pelita Air",
                    confidence: 0.84,
                    currency: "IDR",
                    destinationCity: "Surabaya",
                    destinationCode: "SUB",
                    effectiveDate: "2026-05-01",
                    factType: "tariff_price",
                    flightNumber: "IP-123",
                    isPromo: false,
                    originAirport: "BPN",
                    originCity: "Balikpapan",
                    predicate: "smu_price_per_kg",
                    rawEvidence: "Pelita | Surabaya | SUB | 18000",
                    routeType: "DIRECT",
                    schedule: "Daily",
                    sourceChunkId: null,
                    sourceTableChunkId: "00000000-0000-4000-8000-000000000001",
                    subject: "Pelita Air BPN-SUB",
                    transitRoute: null,
                    unit: "kg",
                    validFrom: "2026-05-01",
                    validUntil: "2026-05-31",
                    valueNumber: 18_000,
                    valueText: "18000",
                },
            ],
            feeRules: [
                {
                    adminFeePerSmu: 10_000,
                    airline: "Pelita Air",
                    dgSurcharge: null,
                    minWeightKg: 10,
                    notes: "PPN excluded",
                    ppnPercent: 11,
                    quarantineNote: null,
                    rawEvidence: "Admin 10000, PPN 11%",
                    shipdecNote: null,
                    sourceChunkId: "00000000-0000-4000-8000-000000000002",
                    sourceTableChunkId: null,
                    warehouseAdminPerSmu: 5000,
                    warehouseFeePerKg: 1000,
                },
            ],
            tariffRows: [
                {
                    airline: "Pelita Air",
                    commodity: "General cargo",
                    confidence: 0.91,
                    destinationCity: "Surabaya",
                    destinationCode: "SUB",
                    effectiveDate: "2026-05-01",
                    flightNumber: "IP-123",
                    isPromo: false,
                    originAirport: "BPN",
                    originCity: "Balikpapan",
                    pageNumber: 1,
                    priceStatus: "NUMERIC",
                    rawEvidence: "Pelita | Surabaya | SUB | 18000",
                    rawRowText: "Pelita | Surabaya | SUB | 18000",
                    routeType: "DIRECT",
                    rowNumber: 3,
                    schedule: "Daily",
                    smuPricePerKg: 18_000,
                    sourceChunkId: null,
                    sourceTableChunkId: "00000000-0000-4000-8000-000000000001",
                    sourceText: "Tariff table",
                    transitRoute: null,
                    validFrom: "2026-05-01",
                    validUntil: "2026-05-31",
                },
            ],
        });

        expect(result.success).toBe(true);
    });

    it("rejects malformed dates and out-of-range confidence", () => {
        const result = structuredExtractionSchema.safeParse({
            documentMetadata: {
                airline: null,
                commodity: null,
                confidence: 2,
                effectiveDate: "05/01/2026",
                isPromo: null,
                originAirport: null,
                originCity: null,
                validFrom: null,
                validUntil: null,
            },
            facts: [],
            feeRules: [],
            tariffRows: [],
        });

        expect(result.success).toBe(false);
    });
});
