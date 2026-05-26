import { describe, expect, it } from "vitest";

import {
    buildDocumentChunkMetadata,
    buildTableChunkMetadata,
    inferSectionTitle,
} from "#/server/ingestion/chunkers/metadata";

describe("chunk metadata", () => {
    it("infers heading-like section titles", () => {
        expect(inferSectionTitle("PELITA AIR\nRates")).toBe("PELITA AIR");
        expect(inferSectionTitle("normal paragraph text")).toBeUndefined();
    });

    it("builds document and table metadata with source references", () => {
        expect(
            buildDocumentChunkMetadata({
                documentId: "doc-1",
                page: {
                    pageNumber: 4,
                    rawText: "RATES\nBody",
                },
                parser: "txt",
            })
        ).toMatchObject({
            documentId: "doc-1",
            pageNumber: 4,
            parser: "txt",
            sectionTitle: "RATES",
            sourceDocumentId: "doc-1",
        });

        expect(
            buildTableChunkMetadata({
                block: {
                    headerText: "Airline | Destination",
                    pageNumber: 5,
                    rawText: "",
                    rows: [],
                    tableIndex: 2,
                },
                documentId: "doc-1",
                row: {
                    cells: ["Pelita", "SUB"],
                    rawText: "Pelita | SUB",
                    rowIndex: 3,
                },
            })
        ).toMatchObject({
            nearbyHeaders: ["Airline | Destination"],
            pageNumber: 5,
            rowIndex: 3,
            sourceDocumentId: "doc-1",
            tableIndex: 2,
        });
    });
});
