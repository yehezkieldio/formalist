import { describe, expect, it } from "vitest";

import { extractTableLikeBlocks } from "#/server/ingestion/parsers/table-like";

describe("table-like extraction", () => {
    it("detects headers, rows, delimiters, and N/A cells", () => {
        const blocks = extractTableLikeBlocks([
            {
                pageNumber: 3,
                rawText:
                    "Airline | Destination | Price\nPelita | Surabaya | 18000\nLion | Makassar | N/A",
            },
        ]);

        expect(blocks).toHaveLength(1);
        expect(blocks[0]).toMatchObject({
            headerText: "Airline | Destination | Price",
            pageNumber: 3,
            tableIndex: 0,
        });
        expect(blocks[0]?.rows).toEqual([
            {
                cells: ["Pelita", "Surabaya", "18000"],
                lineNumber: 2,
                pageNumber: 3,
                rawText: "Pelita | Surabaya | 18000",
                rowIndex: 0,
            },
            {
                cells: ["Lion", "Makassar", "N/A"],
                lineNumber: 3,
                pageNumber: 3,
                rawText: "Lion | Makassar | N/A",
                rowIndex: 1,
            },
        ]);
    });

    it("ignores isolated delimiter lines", () => {
        expect(
            extractTableLikeBlocks([
                {
                    pageNumber: 1,
                    rawText: "Note | only",
                },
            ])
        ).toEqual([]);
    });
});
