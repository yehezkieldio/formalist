import { describe, expect, it } from "vitest";

import {
    extractDeterministicDocumentMetadata,
    extractDeterministicTariffRows,
} from "#/server/ingestion/extractors/deterministic";
import type { ParserResult } from "#/server/ingestion/parsers/types";

const parserResult: ParserResult = {
    metadata: {
        parser: "@opendataloader/pdf",
        sourceFilename: "Promo Pelita K3.pdf",
    },
    pages: [
        {
            pageNumber: 1,
            rawText:
                "Daerah Asal : Balikpapan (Bandar Udara SAMS) Efektif Date : 20 April 2026\nKOMODITY : GENERAL CARGO",
        },
    ],
    rawText:
        "Daerah Asal : Balikpapan (Bandar Udara SAMS) Efektif Date : 20 April 2026\nKOMODITY : GENERAL CARGO",
    tableLikeBlocks: [
        {
            pageNumber: 1,
            rawText:
                "|15|Pelita Air|SURABAYA|SUB|IP-0620|DIRECT|-|Rp 9.350|Harga PROMO|",
            rows: [
                {
                    cells: [],
                    pageNumber: 1,
                    rawText:
                        "|15|Pelita Air|SURABAYA|SUB|IP-0620|DIRECT|-|Rp 9.350|Harga PROMO|",
                    rowIndex: 11,
                },
            ],
            tableIndex: 0,
        },
    ],
    warnings: [],
};

describe("deterministic tariff extraction", () => {
    it("extracts metadata and tariff rows without LLM calls", () => {
        const metadata = extractDeterministicDocumentMetadata(parserResult);
        const rows = extractDeterministicTariffRows(parserResult, {
            documentChunks: [],
            tableChunks: [
                {
                    headerText: null,
                    id: "00000000-0000-4000-8000-000000000001",
                    pageNumber: 1,
                    rowIndex: 11,
                    rowText:
                        "|15|Pelita Air|SURABAYA|SUB|IP-0620|DIRECT|-|Rp 9.350|Harga PROMO|",
                    tableIndex: 0,
                },
            ],
        });

        expect(metadata).toMatchObject({
            commodity: "GENERAL CARGO",
            effectiveDate: "2026-04-20",
            isPromo: true,
            originAirport: "SAMS",
            originCity: "Balikpapan",
        });
        expect(rows).toEqual([
            expect.objectContaining({
                airline: "Pelita Air",
                destinationCity: "SURABAYA",
                destinationCode: "SUB",
                flightNumber: "IP-0620",
                isPromo: true,
                priceStatus: "NUMERIC",
                routeType: "DIRECT",
                smuPricePerKg: 9350,
                sourceTableChunkId: "00000000-0000-4000-8000-000000000001",
            }),
        ]);
    });
});
