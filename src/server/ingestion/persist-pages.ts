import { upsertDocumentPages } from "#/server/db/queries/document-pages";

import type { ParserResult } from "./parsers/types";

export function buildDocumentPageRecords(input: {
    documentId: string;
    parseResult: ParserResult;
}) {
    return input.parseResult.pages.map((page) => ({
        documentId: input.documentId,
        pageNumber: page.pageNumber,
        rawText: page.rawText,
    }));
}

export function persistParsedPages(input: {
    documentId: string;
    parseResult: ParserResult;
}) {
    return upsertDocumentPages(buildDocumentPageRecords(input));
}
