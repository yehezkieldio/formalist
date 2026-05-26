import type { ReviewStatus } from "#/server/db/schema";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { buildTableChunkMetadata } from "./metadata";
import type { ChunkMetadata } from "./metadata";
import { findNearbyNotes } from "./notes";

export interface TableAwareChunk {
    headerText?: string;
    markdown?: string;
    metadata: ChunkMetadata & { nearbyNotes?: string[] };
    pageNumber?: number;
    rowIndex?: number;
    rowText: string;
    status: ReviewStatus;
    tableIndex?: number;
}

function rowNeedsReview(rowText: string): boolean {
    return /\bN\/A\b/iu.test(rowText) || !/\d/u.test(rowText);
}

function buildRowMarkdown(headerText: string | undefined, rowText: string) {
    return headerText ? `${headerText}\n${rowText}` : rowText;
}

export function createTableChunks(
    documentId: string,
    parseResult: ParserResult
): TableAwareChunk[] {
    return parseResult.tableLikeBlocks.flatMap((block) => {
        const nearbyNotes = findNearbyNotes(parseResult, block);

        return block.rows.map((row) => ({
            headerText: block.headerText,
            markdown: buildRowMarkdown(block.headerText, row.rawText),
            metadata: buildTableChunkMetadata({
                block,
                documentId,
                nearbyNotes,
                row,
            }),
            pageNumber: row.pageNumber ?? block.pageNumber,
            rowIndex: row.rowIndex,
            rowText: row.rawText,
            status: rowNeedsReview(row.rawText) ? "needs_review" : "extracted",
            tableIndex: block.tableIndex,
        }));
    });
}
