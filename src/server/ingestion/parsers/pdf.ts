import {
    mkdir,
    mkdtemp,
    readdir,
    readFile,
    rm,
    writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { convert } from "@opendataloader/pdf";

import { extractTableLikeBlocks } from "./table-like";
import type {
    ParsedPage,
    ParserInput,
    ParserMetadata,
    ParserResult,
    ParserWarning,
} from "./types";
import { ParserError } from "./types";

interface PdfTextPage {
    num: number;
    text: string;
}

interface PdfTextResult {
    pages?: PdfTextPage[];
    text: string;
    total: number;
}

interface PdfInfoResult {
    info?: {
        Author?: string;
        CreationDate?: string;
        Creator?: string;
        Producer?: string;
        Title?: string;
    };
    total: number;
}

interface OpenDataLoaderJsonElement {
    content?: string;
    "page number"?: number;
    text?: string;
    type?: string;
}

function pageSeparator(pageNumber: number | string): string {
    return `FORMALIST_PAGE_${pageNumber}`;
}

function splitMarkdownPages(markdown: string): PdfTextPage[] {
    const pages: PdfTextPage[] = [];
    const pattern = /FORMALIST_PAGE_(\d+)/gu;
    const matches = [...markdown.matchAll(pattern)];

    if (matches.length === 0) {
        return [{ num: 1, text: markdown }];
    }

    for (const [index, match] of matches.entries()) {
        const nextMatch = matches[index + 1];
        const start = (match.index ?? 0) + match[0].length;
        const end = nextMatch?.index ?? markdown.length;
        pages.push({
            num: Number(match[1]),
            text: markdown.slice(start, end).trim(),
        });
    }

    return pages;
}

function extractJsonPages(
    elements: OpenDataLoaderJsonElement[]
): PdfTextPage[] {
    const pages = new Map<number, string[]>();

    for (const element of elements) {
        const pageNumber = element["page number"];
        const content = element.content ?? element.text;

        if (!pageNumber || !content) {
            continue;
        }

        const pageLines = pages.get(pageNumber) ?? [];
        pageLines.push(content);
        pages.set(pageNumber, pageLines);
    }

    return [...pages.entries()]
        .toSorted(([left], [right]) => left - right)
        .map(([num, lines]) => ({
            num,
            text: lines.join("\n"),
        }));
}

async function findOutputFile(outputDir: string, extension: string) {
    const files = await readdir(outputDir);
    const file = files.find((candidate) => candidate.endsWith(extension));

    return file ? path.join(outputDir, file) : undefined;
}

export function mapPdfTextResult(
    input: ParserInput,
    textResult: PdfTextResult,
    infoResult?: PdfInfoResult
): ParserResult {
    const pages: ParsedPage[] = textResult.pages
        ? textResult.pages.map((page) => ({
              pageNumber: page.num,
              rawText: page.text.trim(),
          }))
        : textResult.text.split("\f").map((pageText, index) => ({
              pageNumber: index + 1,
              rawText: pageText.trim(),
          }));
    const rawText = textResult.text.trim();
    const metadata: ParserMetadata = {
        author: infoResult?.info?.Author,
        createdAt: infoResult?.info?.CreationDate,
        pageCount: infoResult?.total ?? textResult.total,
        parser: "opendataloader-pdf",
        producer: infoResult?.info?.Producer ?? infoResult?.info?.Creator,
        sourceFilename: input.filename,
        title: infoResult?.info?.Title,
    };
    const warnings: ParserWarning[] =
        rawText.length === 0
            ? [
                  {
                      code: "pdf-scanned-or-empty",
                      message:
                          "No selectable text was extracted from the PDF. The document may be scanned-only.",
                      severity: "high",
                  },
              ]
            : [];

    return {
        metadata,
        pages,
        rawText,
        tableLikeBlocks: extractTableLikeBlocks(pages),
        warnings,
    };
}

export async function parsePdfDocument(
    input: ParserInput
): Promise<ParserResult> {
    const workDir = await mkdtemp(path.join(os.tmpdir(), "formalist-pdf-"));
    const inputPath = path.join(workDir, input.filename);
    const outputDir = path.join(workDir, "out");

    try {
        await writeFile(inputPath, input.bytes);
        await mkdir(outputDir, { recursive: true });
        await convert(inputPath, {
            format: "json,markdown",
            imageOutput: "off",
            keepLineBreaks: true,
            markdownPageSeparator: pageSeparator("%page-number%"),
            outputDir,
            quiet: true,
            readingOrder: "xycut",
            tableMethod: "cluster",
        });

        const markdownPath = await findOutputFile(outputDir, ".md");
        const jsonPath = await findOutputFile(outputDir, ".json");
        const markdown = markdownPath
            ? await readFile(markdownPath, "utf-8")
            : "";
        const jsonText = jsonPath ? await readFile(jsonPath, "utf-8") : "[]";
        const parsedJson = JSON.parse(jsonText) as OpenDataLoaderJsonElement[];
        const jsonPages = Array.isArray(parsedJson)
            ? extractJsonPages(parsedJson)
            : [];
        const pages =
            jsonPages.length > 0 ? jsonPages : splitMarkdownPages(markdown);
        const rawText = pages.map((page) => page.text).join("\f");
        const result = mapPdfTextResult(
            input,
            {
                pages,
                text: rawText,
                total: pages.length,
            },
            {
                total: pages.length,
            }
        );

        if (result.rawText.length === 0) {
            throw new ParserError(
                "pdf-scanned-or-empty",
                "No selectable text was extracted from the PDF."
            );
        }

        return result;
    } finally {
        await rm(workDir, { force: true, recursive: true });
    }
}
