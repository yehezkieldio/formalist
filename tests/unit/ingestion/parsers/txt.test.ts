import { describe, expect, it } from "vitest";

import { parseDocument } from "#/server/ingestion/parsers";
import { parseTxtDocument } from "#/server/ingestion/parsers/txt";

describe("TXT parser", () => {
    it("returns raw text, synthetic pages, and line ranges", () => {
        const result = parseTxtDocument({
            bytes: Buffer.from("Title\nA  B\n1  2\fSecond page"),
            fileType: "txt",
            filename: "tariff.txt",
        });

        expect(result.rawText).toContain("Title");
        expect(result.pages).toHaveLength(2);
        expect(result.pages[0]).toMatchObject({
            lineEnd: 3,
            lineStart: 1,
            pageNumber: 1,
        });
        expect(result.metadata).toMatchObject({
            pageCount: 2,
            parser: "txt",
        });
    });

    it("rejects unsupported files through the dispatcher", async () => {
        await expect(
            parseDocument({
                bytes: Buffer.from(""),
                fileType: "csv",
                filename: "tariff.csv",
            })
        ).rejects.toThrow("Unsupported document file type");
    });
});
