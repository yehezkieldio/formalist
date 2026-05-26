import type {
    ParsedTableLikeBlock,
    ParserResult,
} from "#/server/ingestion/parsers/types";

const notePattern = /^(note|notes|catatan|remark|remarks)\b[:\s-]*/iu;

export function findNearbyNotes(
    parseResult: ParserResult,
    block: ParsedTableLikeBlock
): string[] {
    const page = parseResult.pages.find(
        (candidate) => candidate.pageNumber === block.pageNumber
    );

    if (!page) {
        return [];
    }

    return page.rawText
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => notePattern.test(line))
        .slice(0, 5);
}
