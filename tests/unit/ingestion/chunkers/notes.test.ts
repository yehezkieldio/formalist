import { describe, expect, it } from "vitest";

import { findNearbyNotes } from "#/server/ingestion/chunkers/notes";
import type { ParserResult } from "#/server/ingestion/parsers/types";

describe("nearby notes", () => {
    it("associates page-local notes with table chunks", () => {
        const parseResult: ParserResult = {
            metadata: {
                parser: "txt",
                sourceFilename: "tariff.txt",
            },
            pages: [
                {
                    pageNumber: 1,
                    rawText: "Note: excludes PPN\nCatatan: admin fee applies",
                },
            ],
            rawText: "",
            tableLikeBlocks: [],
            warnings: [],
        };

        expect(
            findNearbyNotes(parseResult, {
                pageNumber: 1,
                rawText: "",
                rows: [],
                tableIndex: 0,
            })
        ).toEqual(["Note: excludes PPN", "Catatan: admin fee applies"]);
    });
});
