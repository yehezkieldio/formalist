import { extractTableLikeBlocks } from "./table-like";
import type { ParsedPage, ParserInput, ParserResult } from "./types";

function normalizeText(bytes: Buffer): string {
    return bytes.toString("utf-8").replaceAll("\r\n", "\n");
}

function buildPages(rawText: string): ParsedPage[] {
    const pageTexts = rawText.split("\f");
    let lineCursor = 1;

    return pageTexts.map((pageText, index) => {
        const lineCount =
            pageText.length === 0 ? 0 : pageText.split("\n").length;
        const page: ParsedPage = {
            lineEnd: lineCursor + Math.max(lineCount - 1, 0),
            lineStart: lineCursor,
            pageNumber: index + 1,
            rawText: pageText.trim(),
        };
        lineCursor += lineCount;

        return page;
    });
}

export function parseTxtDocument(input: ParserInput): ParserResult {
    const rawText = normalizeText(input.bytes).trim();
    const pages = buildPages(rawText);

    return {
        metadata: {
            pageCount: pages.length,
            parser: "txt",
            sourceFilename: input.filename,
        },
        pages,
        rawText,
        tableLikeBlocks: extractTableLikeBlocks(pages),
        warnings: [],
    };
}
