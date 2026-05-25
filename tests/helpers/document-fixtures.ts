import type { ParserResult } from "#/server/ingestion/parsers/types";

export const syntheticTariffText = [
    "Pelita Air Cargo Pricelist",
    "Origin: Balikpapan BPN",
    "Effective date: 2026-01-01",
    "Valid until: 2026-12-31",
    "AIRLINE | DESTINATION | CODE | ROUTE | SMU/KG | SCHEDULE",
    "Pelita | Surabaya | SUB | DIRECT | 18000 | Mon Wed Fri",
    "Pelita | Makassar | UPG | TRANSIT BPN-CGK-UPG | 21000 | Daily",
    "Fee notes: admin 5000/SMU, warehouse 1000/kg, PPN 11%, min 10kg",
].join("\n");

export function createSyntheticTxtFixture() {
    return new TextEncoder().encode(syntheticTariffText);
}

export function createSyntheticParserResult(
    _documentId = "00000000-0000-0000-0000-000000000001"
): ParserResult {
    return {
        metadata: {
            parser: "test-fixture",
            sourceFilename: "synthetic-pelita.txt",
            title: "Synthetic Pelita Tariff Fixture",
        },
        pages: [
            {
                pageNumber: 1,
                rawText: syntheticTariffText,
            },
        ],
        rawText: syntheticTariffText,
        tableLikeBlocks: [
            {
                headerText:
                    "AIRLINE | DESTINATION | CODE | ROUTE | SMU/KG | SCHEDULE",
                pageNumber: 1,
                rawText:
                    "Pelita | Surabaya | SUB | DIRECT | 18000 | Mon Wed Fri\nPelita | Makassar | UPG | TRANSIT BPN-CGK-UPG | 21000 | Daily",
                rows: [
                    {
                        cells: [
                            "Pelita",
                            "Surabaya",
                            "SUB",
                            "DIRECT",
                            "18000",
                            "Mon Wed Fri",
                        ],
                        pageNumber: 1,
                        rawText:
                            "Pelita | Surabaya | SUB | DIRECT | 18000 | Mon Wed Fri",
                        rowIndex: 0,
                    },
                    {
                        cells: [
                            "Pelita",
                            "Makassar",
                            "UPG",
                            "TRANSIT BPN-CGK-UPG",
                            "21000",
                            "Daily",
                        ],
                        pageNumber: 1,
                        rawText:
                            "Pelita | Makassar | UPG | TRANSIT BPN-CGK-UPG | 21000 | Daily",
                        rowIndex: 1,
                    },
                ],
                tableIndex: 0,
            },
        ],
        warnings: [],
    };
}
