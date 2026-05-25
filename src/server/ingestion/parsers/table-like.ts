import type { ParsedPage, ParsedTableLikeBlock, ParsedTableRow } from "./types";

const pipeDelimiter = /\|/u;
const tabDelimiter = /\t/u;
const repeatedSpaceDelimiter = /\s{2,}/u;
const naCellPattern = /^n\/?a$/iu;

function splitCells(line: string): string[] {
    let delimiter = repeatedSpaceDelimiter;

    if (pipeDelimiter.test(line)) {
        delimiter = pipeDelimiter;
    } else if (tabDelimiter.test(line)) {
        delimiter = tabDelimiter;
    }

    return line
        .split(delimiter)
        .map((cell) => cell.trim())
        .filter(Boolean);
}

function isRowLike(line: string): boolean {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
        return false;
    }

    const cells = splitCells(trimmed);
    const hasDelimiter =
        pipeDelimiter.test(trimmed) ||
        tabDelimiter.test(trimmed) ||
        repeatedSpaceDelimiter.test(trimmed);

    return hasDelimiter && cells.length >= 2;
}

function createRow(input: {
    lineNumber: number;
    pageNumber: number;
    rawText: string;
    rowIndex: number;
}): ParsedTableRow {
    return {
        cells: splitCells(input.rawText),
        lineNumber: input.lineNumber,
        pageNumber: input.pageNumber,
        rawText: input.rawText.trim(),
        rowIndex: input.rowIndex,
    };
}

function hasNaRow(row: ParsedTableRow): boolean {
    return row.cells.some((cell) => naCellPattern.test(cell));
}

function appendTableBlock(input: {
    blocks: ParsedTableLikeBlock[];
    pageNumber: number;
    rows: ParsedTableRow[];
    tableIndex: number;
}): boolean {
    if (input.rows.length < 2) {
        return false;
    }

    const [header, ...rows] = input.rows;
    const blockRows = rows.length > 0 ? rows : input.rows;
    input.blocks.push({
        headerText: rows.length > 0 ? header?.rawText : undefined,
        pageNumber: input.pageNumber,
        rawText: input.rows.map((row) => row.rawText).join("\n"),
        rows: blockRows.map((row, index) => ({
            ...row,
            rowIndex: index,
        })),
        tableIndex: input.tableIndex,
    });

    return true;
}

export function extractTableLikeBlocks(
    pages: ParsedPage[]
): ParsedTableLikeBlock[] {
    const blocks: ParsedTableLikeBlock[] = [];
    let tableIndex = 0;

    for (const page of pages) {
        const lines = page.rawText.split(/\r?\n/u);
        let activeRows: ParsedTableRow[] = [];

        for (const [index, line] of lines.entries()) {
            if (isRowLike(line)) {
                activeRows.push(
                    createRow({
                        lineNumber: index + 1,
                        pageNumber: page.pageNumber,
                        rawText: line,
                        rowIndex: activeRows.length,
                    })
                );
                continue;
            }

            const appended = appendTableBlock({
                blocks,
                pageNumber: page.pageNumber,
                rows: activeRows,
                tableIndex,
            });
            tableIndex += appended ? 1 : 0;
            activeRows = [];
        }

        const appended = appendTableBlock({
            blocks,
            pageNumber: page.pageNumber,
            rows: activeRows,
            tableIndex,
        });
        tableIndex += appended ? 1 : 0;
    }

    return blocks.map((block) => ({
        ...block,
        rows: block.rows.map((row) => ({
            ...row,
            cells: hasNaRow(row)
                ? row.cells.map((cell) =>
                      naCellPattern.test(cell) ? "N/A" : cell
                  )
                : row.cells,
        })),
    }));
}
