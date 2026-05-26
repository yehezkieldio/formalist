export const supportedParseFileTypes = ["pdf", "docx", "txt"] as const;

export type SupportedParseFileType = (typeof supportedParseFileTypes)[number];

export interface ParserInput {
    bytes: Buffer;
    documentId?: string;
    filename: string;
    fileType: string;
    mimeType?: string;
}

export interface ParserWarning {
    code: string;
    message: string;
    pageNumber?: number;
    severity: "low" | "medium" | "high";
}

export interface ParsedPage {
    lineEnd?: number;
    lineStart?: number;
    pageNumber: number;
    rawText: string;
}

export interface ParsedTableRow {
    cells: string[];
    lineNumber?: number;
    pageNumber?: number;
    rawText: string;
    rowIndex: number;
}

export interface ParsedTableLikeBlock {
    headerText?: string;
    pageNumber?: number;
    rawText: string;
    rows: ParsedTableRow[];
    tableIndex: number;
}

export interface ParserMetadata {
    author?: string;
    createdAt?: string;
    pageCount?: number;
    parser: string;
    producer?: string;
    sourceFilename: string;
    title?: string;
}

export interface ParserResult {
    metadata: ParserMetadata;
    pages: ParsedPage[];
    rawText: string;
    tableLikeBlocks: ParsedTableLikeBlock[];
    warnings: ParserWarning[];
}

export class ParserError extends Error {
    code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = "ParserError";
        this.code = code;
    }
}
