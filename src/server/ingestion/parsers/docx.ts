import { OfficeGenerator, OfficeParser } from "officeparser";

import { extractTableLikeBlocks } from "./table-like";
import type { ParserInput, ParserResult, ParserWarning } from "./types";

interface OfficeParseIssue {
    code: string;
    message: string;
    type: "error" | "info" | "warning";
}

function messageToWarning(message: OfficeParseIssue): ParserWarning {
    return {
        code: `officeparser-${message.code}`,
        message: message.message,
        severity: message.type === "error" ? "high" : "medium",
    };
}

export async function parseDocxDocument(
    input: ParserInput
): Promise<ParserResult> {
    const ast = await OfficeParser.parseOffice(input.bytes, {
        includeBreakNodes: true,
        newlineDelimiter: "\n",
    });
    const textResult = await OfficeGenerator.generate(
        { ...ast, type: "docx" },
        "text"
    );
    const rawText = String(textResult.value).trim();
    const pages = [
        {
            lineEnd: rawText.length === 0 ? 1 : rawText.split(/\r?\n/u).length,
            lineStart: 1,
            pageNumber: 1,
            rawText,
        },
    ];
    const messages = [
        ...((ast.warnings ?? []) as OfficeParseIssue[]),
        ...(textResult.messages as OfficeParseIssue[]),
    ];

    return {
        metadata: {
            author: ast.metadata.author,
            createdAt: ast.metadata.created?.toISOString(),
            pageCount: ast.metadata.pages ?? 1,
            parser: "docx-officeparser",
            sourceFilename: input.filename,
            title: ast.metadata.title,
        },
        pages,
        rawText,
        tableLikeBlocks: extractTableLikeBlocks(pages),
        warnings: messages.map(messageToWarning),
    };
}
