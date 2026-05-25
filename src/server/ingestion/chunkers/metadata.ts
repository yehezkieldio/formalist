import type {
    ParsedPage,
    ParsedTableLikeBlock,
    ParsedTableRow,
} from "#/server/ingestion/parsers/types";

export interface ChunkMetadata {
    documentId: string;
    nearbyHeaders?: string[];
    pageNumber?: number;
    parser?: string;
    rowIndex?: number;
    sectionTitle?: string;
    sourceDocumentId: string;
    tableIndex?: number;
}

export function inferSectionTitle(text: string): string | undefined {
    const firstLine = text
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .find((line) => line.length > 0);

    if (!firstLine) {
        return;
    }

    const looksLikeHeading =
        firstLine.length <= 120 &&
        (firstLine === firstLine.toUpperCase() || /^#{1,6}\s/u.test(firstLine));

    return looksLikeHeading ? firstLine.replace(/^#{1,6}\s/u, "") : undefined;
}

export function buildDocumentChunkMetadata(input: {
    documentId: string;
    page: ParsedPage;
    parser?: string;
    sectionTitle?: string;
}): ChunkMetadata {
    return {
        documentId: input.documentId,
        pageNumber: input.page.pageNumber,
        parser: input.parser,
        sectionTitle:
            input.sectionTitle ?? inferSectionTitle(input.page.rawText),
        sourceDocumentId: input.documentId,
    };
}

export function buildTableChunkMetadata(input: {
    block: ParsedTableLikeBlock;
    documentId: string;
    nearbyNotes?: string[];
    row: ParsedTableRow;
}): ChunkMetadata & { nearbyNotes?: string[] } {
    return {
        documentId: input.documentId,
        nearbyHeaders: input.block.headerText
            ? [input.block.headerText]
            : undefined,
        nearbyNotes:
            input.nearbyNotes && input.nearbyNotes.length > 0
                ? input.nearbyNotes
                : undefined,
        pageNumber: input.row.pageNumber ?? input.block.pageNumber,
        rowIndex: input.row.rowIndex,
        sourceDocumentId: input.documentId,
        tableIndex: input.block.tableIndex,
    };
}
