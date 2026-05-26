import { describe, expect, it } from "vitest";

import { createDocumentChunks } from "#/server/ingestion/chunkers/document-chunker";
import type { ParserResult } from "#/server/ingestion/parsers/types";

const parseResult: ParserResult = {
    metadata: {
        parser: "txt",
        sourceFilename: "tariff.txt",
    },
    pages: [
        {
            pageNumber: 1,
            rawText:
                "PELITA AIR\nHarga tujuan Surabaya berlaku sampai akhir bulan. Harga tujuan Makassar berlaku untuk direct flight. Note: belum termasuk PPN.",
        },
    ],
    rawText: "",
    tableLikeBlocks: [],
    warnings: [],
};

describe("document chunker", () => {
    it("uses stable indexes and preserves page metadata", async () => {
        const chunks = await createDocumentChunks("doc-1", parseResult, {
            chunkOverlap: 0,
            chunkSize: 10,
        });

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(
            chunks.map((_, index) => index)
        );
        expect(chunks[0]).toMatchObject({
            metadata: {
                documentId: "doc-1",
                pageNumber: 1,
                parser: "txt",
                sentenceCount: 1,
                sourceDocumentId: "doc-1",
            },
            pageNumber: 1,
        });
        expect(chunks[0]?.metadata.tokenCount).toBeGreaterThan(0);
    });
});
