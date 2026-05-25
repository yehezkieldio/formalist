import { describe, expect, it } from "vitest";

import { createTableChunks } from "#/server/ingestion/chunkers/table-chunker";
import type { ParserResult } from "#/server/ingestion/parsers/types";

const parseResult: ParserResult = {
    metadata: {
        parser: "txt",
        sourceFilename: "tariff.txt",
    },
    pages: [
        {
            pageNumber: 2,
            rawText:
                "Airline | Destination | Price\nPelita | SUB | 18000\nLion | UPG | N/A\nNote: price excludes PPN",
        },
    ],
    rawText: "",
    tableLikeBlocks: [
        {
            headerText: "Airline | Destination | Price",
            pageNumber: 2,
            rawText:
                "Airline | Destination | Price\nPelita | SUB | 18000\nLion | UPG | N/A",
            rows: [
                {
                    cells: ["Pelita", "SUB", "18000"],
                    pageNumber: 2,
                    rawText: "Pelita | SUB | 18000",
                    rowIndex: 0,
                },
                {
                    cells: ["Lion", "UPG", "N/A"],
                    pageNumber: 2,
                    rawText: "Lion | UPG | N/A",
                    rowIndex: 1,
                },
            ],
            tableIndex: 0,
        },
    ],
    warnings: [],
};

describe("table chunker", () => {
    it("preserves row metadata and marks suspicious rows for review", () => {
        const chunks = createTableChunks("doc-1", parseResult);

        expect(chunks).toHaveLength(2);
        expect(chunks[0]).toMatchObject({
            headerText: "Airline | Destination | Price",
            pageNumber: 2,
            rowIndex: 0,
            status: "extracted",
            tableIndex: 0,
        });
        expect(chunks[1]).toMatchObject({
            metadata: {
                nearbyNotes: ["Note: price excludes PPN"],
                rowIndex: 1,
                tableIndex: 0,
            },
            status: "needs_review",
        });
    });
});
