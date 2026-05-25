import { beforeEach, describe, expect, it, vi } from "vitest";

const documentQueryMock = {
    updateDocumentMetadata: vi.fn(() => Promise.resolve()),
};

const extractedRecordQueryMock = {
    insertExtractedFacts: vi.fn((records) => Promise.resolve(records)),
    insertFeeRules: vi.fn((records) => Promise.resolve(records)),
    insertTariffRows: vi.fn((records) => Promise.resolve(records)),
};

const statusMock = {
    setIngestionDocumentStatus: vi.fn(() => Promise.resolve()),
};

vi.mock("#/server/db/queries/documents", () => documentQueryMock);
vi.mock(
    "#/server/db/queries/extracted-records",
    () => extractedRecordQueryMock
);
vi.mock("#/server/ingestion/status", () => statusMock);

describe("extraction persistence and policy", () => {
    beforeEach(() => {
        documentQueryMock.updateDocumentMetadata.mockClear();
        extractedRecordQueryMock.insertExtractedFacts.mockClear();
        extractedRecordQueryMock.insertFeeRules.mockClear();
        extractedRecordQueryMock.insertTariffRows.mockClear();
        statusMock.setIngestionDocumentStatus.mockClear();
    });

    it("persists extracted records as review-gated statuses and never active", async () => {
        const { persistStructuredExtraction } =
            await import("#/server/ingestion/persist-extracted");

        await persistStructuredExtraction({
            documentId: "doc-1",
            extraction: {
                documentMetadata: {
                    airline: "Pelita Air",
                    commodity: null,
                    confidence: 0.9,
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
                        confidence: 0.6,
                        currency: "IDR",
                        destinationCity: "Surabaya",
                        destinationCode: "SUB",
                        effectiveDate: "2026-05-01",
                        factType: "tariff_price",
                        flightNumber: null,
                        isPromo: false,
                        originAirport: "BPN",
                        originCity: "Balikpapan",
                        predicate: "smu_price_per_kg",
                        rawEvidence: "Pelita SUB 18000",
                        routeType: "DIRECT",
                        schedule: null,
                        sourceChunkId: null,
                        sourceTableChunkId: null,
                        subject: "Pelita SUB",
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
                        notes: null,
                        ppnPercent: 11,
                        quarantineNote: null,
                        rawEvidence: "Admin 10000 PPN 11",
                        shipdecNote: null,
                        sourceChunkId: null,
                        sourceTableChunkId: null,
                        warehouseAdminPerSmu: null,
                        warehouseFeePerKg: null,
                    },
                ],
                tariffRows: [
                    {
                        airline: "Pelita Air",
                        commodity: null,
                        confidence: 0.95,
                        destinationCity: "Surabaya",
                        destinationCode: "SUB",
                        effectiveDate: "2026-05-01",
                        flightNumber: null,
                        isPromo: false,
                        originAirport: "BPN",
                        originCity: "Balikpapan",
                        pageNumber: 1,
                        priceStatus: "NUMERIC",
                        rawEvidence: "Pelita SUB 18000",
                        rawRowText: "Pelita SUB 18000",
                        routeType: "DIRECT",
                        rowNumber: 1,
                        schedule: null,
                        smuPricePerKg: 18_000,
                        sourceChunkId: null,
                        sourceTableChunkId: null,
                        sourceText: "Pelita SUB 18000",
                        transitRoute: null,
                        validFrom: "2026-05-01",
                        validUntil: "2026-05-31",
                    },
                ],
            },
        });

        expect(
            extractedRecordQueryMock.insertExtractedFacts
        ).toHaveBeenCalledWith([
            expect.objectContaining({
                confidence: "0.6",
                documentId: "doc-1",
                status: "needs_review",
                valueNumber: "18000",
            }),
        ]);
        expect(extractedRecordQueryMock.insertTariffRows).toHaveBeenCalledWith([
            expect.objectContaining({
                confidence: "0.95",
                documentId: "doc-1",
                status: "extracted",
            }),
        ]);
        expect(extractedRecordQueryMock.insertFeeRules).toHaveBeenCalledWith([
            expect.objectContaining({
                documentId: "doc-1",
                minWeightKg: "10",
                ppnPercent: "11",
                status: "extracted",
            }),
        ]);
    });

    it("marks missing OpenRouter key as setup-required without throwing", async () => {
        const { markExtractionSetupRequired } =
            await import("#/server/ingestion/extractors/policy");

        await markExtractionSetupRequired({
            attempts: 0,
            documentId: "doc-1",
            id: "job-1",
            maxAttempts: 3,
            payload: { documentId: "doc-1" },
            type: "extract-structured-data",
        });

        expect(statusMock.setIngestionDocumentStatus).toHaveBeenCalledWith({
            error: "LLM extraction setup required: OPENROUTER_API_KEY is not configured.",
            job: expect.objectContaining({ id: "job-1" }),
            status: "needs_review",
        });
    });
});
