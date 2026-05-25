import { beforeEach, describe, expect, it, vi } from "vitest";

const officeParserMock = {
    generate: vi.fn(),
    parseOffice: vi.fn(),
};

vi.mock("officeparser", () => ({
    OfficeGenerator: {
        generate: officeParserMock.generate,
    },
    OfficeParser: {
        parseOffice: officeParserMock.parseOffice,
    },
}));

describe("DOCX parser", () => {
    beforeEach(() => {
        officeParserMock.generate.mockReset();
        officeParserMock.parseOffice.mockReset();
    });

    it("extracts paragraphs, table-like text, metadata, and warnings", async () => {
        officeParserMock.parseOffice.mockResolvedValue({
            content: [],
            metadata: {
                author: "Ops",
                created: new Date("2026-01-01T00:00:00Z"),
                pages: 1,
                title: "Tariff",
            },
            type: "docx",
            warnings: [
                {
                    code: "unsupported_element",
                    message: "Unknown style",
                    type: "warning",
                },
            ],
        });
        officeParserMock.generate.mockResolvedValue({
            messages: [],
            value: "Airline | Destination | Price\nPelita | SUB | 18000",
        });
        const { parseDocxDocument } =
            await import("#/server/ingestion/parsers/docx");

        const result = await parseDocxDocument({
            bytes: Buffer.from("docx"),
            fileType: "docx",
            filename: "tariff.docx",
        });

        expect(officeParserMock.parseOffice).toHaveBeenCalledWith(
            Buffer.from("docx"),
            {
                includeBreakNodes: true,
                newlineDelimiter: "\n",
            }
        );
        expect(result.metadata).toMatchObject({
            author: "Ops",
            createdAt: "2026-01-01T00:00:00.000Z",
            pageCount: 1,
            parser: "docx-officeparser",
            sourceFilename: "tariff.docx",
            title: "Tariff",
        });
        expect(result.pages[0]?.pageNumber).toBe(1);
        expect(result.tableLikeBlocks).toHaveLength(1);
        expect(result.warnings).toEqual([
            {
                code: "officeparser-unsupported_element",
                message: "Unknown style",
                severity: "medium",
            },
        ]);
    });
});
