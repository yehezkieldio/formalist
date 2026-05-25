import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { ChunkType } from "#/server/db/schema";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import { buildDocumentChunkMetadata, inferSectionTitle } from "./metadata";
import type { ChunkMetadata } from "./metadata";

const defaultChunkSize = 1200;
const defaultChunkOverlap = 180;

export interface SemanticDocumentChunk {
    chunkIndex: number;
    chunkType: ChunkType;
    content: string;
    metadata: ChunkMetadata;
    pageNumber?: number;
}

export interface DocumentChunkerOptions {
    chunkOverlap?: number;
    chunkSize?: number;
}

function inferChunkType(content: string): ChunkType {
    const trimmed = content.trim();

    if (trimmed.length === 0) {
        return "unknown";
    }

    if (/^(note|catatan|remarks?)\b/iu.test(trimmed)) {
        return "note";
    }

    if (inferSectionTitle(trimmed)) {
        return "heading";
    }

    if (/\|/u.test(trimmed) || /\s{2,}/u.test(trimmed)) {
        return "mixed";
    }

    return "narrative";
}

export async function createDocumentChunks(
    documentId: string,
    parseResult: ParserResult,
    options: DocumentChunkerOptions = {}
): Promise<SemanticDocumentChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkOverlap: options.chunkOverlap ?? defaultChunkOverlap,
        chunkSize: options.chunkSize ?? defaultChunkSize,
    });
    const chunks: SemanticDocumentChunk[] = [];

    for (const page of parseResult.pages) {
        const splitTexts = await splitter.splitText(page.rawText);
        const sectionTitle = inferSectionTitle(page.rawText);

        for (const content of splitTexts) {
            const trimmed = content.trim();

            if (trimmed.length === 0) {
                continue;
            }

            chunks.push({
                chunkIndex: chunks.length,
                chunkType: inferChunkType(trimmed),
                content: trimmed,
                metadata: buildDocumentChunkMetadata({
                    documentId,
                    page,
                    parser: parseResult.metadata.parser,
                    sectionTitle,
                }),
                pageNumber: page.pageNumber,
            });
        }
    }

    return chunks;
}
