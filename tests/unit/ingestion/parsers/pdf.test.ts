import { describe, expect, it } from "vitest";

import { mapPdfTextResult } from "#/server/ingestion/parsers/pdf";
import { ParserError } from "#/server/ingestion/parsers/types";

describe("PDF parser mapping", () => {
    it("preserves PDF page numbers and metadata", () => {
        const result = mapPdfTextResult(
            {
                bytes: Buffer.from("%PDF"),
                fileType: "pdf",
                filename: "tariff.pdf",
            },
            {
                pages: [
                    { num: 1, text: "Header\nA | B\n1 | 2" },
                    { num: 2, text: "Second page" },
                ],
                text: "Header\nA | B\n1 | 2\nSecond page",
                total: 2,
            },
            {
                info: {
                    Author: "Ops",
                    Producer: "PDF Tool",
                    Title: "Tariff",
                },
                total: 2,
            }
        );

        expect(result.pages).toEqual([
            {
                pageNumber: 1,
                rawText: "Header\nA | B\n1 | 2",
            },
            {
                pageNumber: 2,
                rawText: "Second page",
            },
        ]);
        expect(result.metadata).toMatchObject({
            author: "Ops",
            pageCount: 2,
            parser: "opendataloader-pdf",
            producer: "PDF Tool",
            title: "Tariff",
        });
        expect(result.tableLikeBlocks[0]?.pageNumber).toBe(1);
    });

    it("reports scanned-only PDFs as controlled parser errors", () => {
        const result = mapPdfTextResult(
            {
                bytes: Buffer.from("%PDF"),
                fileType: "pdf",
                filename: "scan.pdf",
            },
            {
                pages: [],
                text: "",
                total: 0,
            }
        );

        expect(result.warnings).toContainEqual({
            code: "pdf-scanned-or-empty",
            message:
                "No selectable text was extracted from the PDF. The document may be scanned-only.",
            severity: "high",
        });
        expect(
            new ParserError(
                "pdf-scanned-or-empty",
                "No selectable text was extracted from the PDF."
            )
        ).toMatchObject({ code: "pdf-scanned-or-empty" });
    });
});
