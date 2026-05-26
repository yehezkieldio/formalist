import type { ParserResult } from "#/server/ingestion/parsers/types";

export interface ExtractionSourceContext {
    documentChunks: {
        chunkIndex: number;
        content: string;
        id: string;
        pageNumber: number | null;
    }[];
    tableChunks: {
        headerText: string | null;
        id: string;
        pageNumber: number | null;
        rowIndex: number | null;
        rowText: string;
        tableIndex: number | null;
    }[];
}

function buildSourceCatalog(context?: ExtractionSourceContext): string {
    if (!context) {
        return "No persisted source catalog was provided.";
    }

    const documentCatalog = context.documentChunks
        .map(
            (chunk) =>
                `document_chunk ${chunk.id} page ${chunk.pageNumber ?? "unknown"} index ${chunk.chunkIndex}: ${chunk.content.slice(0, 400)}`
        )
        .join("\n");
    const tableCatalog = context.tableChunks
        .map(
            (chunk) =>
                `table_chunk ${chunk.id} page ${chunk.pageNumber ?? "unknown"} table ${chunk.tableIndex ?? "unknown"} row ${chunk.rowIndex ?? "unknown"} header ${chunk.headerText ?? "none"}: ${chunk.rowText.slice(0, 500)}`
        )
        .join("\n");

    return [
        "Use these exact UUIDs for sourceChunkId and sourceTableChunkId when a record is supported by a listed source.",
        documentCatalog || "No document chunks persisted.",
        tableCatalog || "No table chunks persisted.",
    ].join("\n");
}

export function buildExtractionPrompt(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): string {
    const pages = parseResult.pages
        .map((page) => `Page ${page.pageNumber}\n${page.rawText}`)
        .join("\n\n---\n\n");
    const tables = parseResult.tableLikeBlocks
        .map(
            (table) =>
                `Table ${table.tableIndex} page ${table.pageNumber ?? "unknown"}\n${table.rawText}`
        )
        .join("\n\n");

    return [
        "Extract air cargo tariff and pricelist data.",
        "Return only facts supported by the source text.",
        "Do not infer missing prices, fees, routes, dates, or schedules.",
        "Use null for unknown fields.",
        "All extracted records are untrusted until admin review.",
        "",
        "Persisted source catalog:",
        buildSourceCatalog(context),
        "",
        "Pages:",
        pages,
        "",
        "Table-like blocks:",
        tables || "None detected.",
    ].join("\n");
}

export function buildCompactExtractionPrompt(input: {
    context?: ExtractionSourceContext;
    keywords: RegExp;
    maxRows?: number;
    parseResult: ParserResult;
    task: string;
}): string {
    const maxRows = input.maxRows ?? 80;
    const pageSnippets = input.parseResult.pages
        .map((page) => {
            const lines = page.rawText
                .split("\n")
                .filter((line) => input.keywords.test(line))
                .slice(0, 12)
                .join("\n");

            return lines ? `Page ${page.pageNumber}\n${lines}` : "";
        })
        .filter(Boolean)
        .join("\n\n");
    const tableSnippets =
        input.context?.tableChunks
            .filter(
                (chunk) =>
                    input.keywords.test(chunk.rowText) ||
                    input.keywords.test(chunk.headerText ?? "")
            )
            .slice(0, maxRows)
            .map(
                (chunk) =>
                    `table_chunk ${chunk.id} page ${chunk.pageNumber ?? "unknown"} row ${chunk.rowIndex ?? "unknown"}: ${chunk.rowText}`
            )
            .join("\n") ?? "";

    return [
        input.task,
        "Return only records directly supported by the provided snippets.",
        "Use null for unknown fields. Do not infer missing prices, fees, routes, dates, or schedules.",
        "",
        "Relevant page snippets:",
        pageSnippets || "No relevant page snippets found.",
        "",
        "Relevant table/source snippets:",
        tableSnippets || "No relevant table snippets found.",
    ].join("\n");
}
