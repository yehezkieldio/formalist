import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { countTokens } from "gpt-tokenizer";
import { split as splitSentences } from "sentence-splitter";

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

export function getSentenceTexts(text: string): string[] {
    const sentences = splitSentences(text)
        .filter((node) => node.type === "Sentence")
        .map((node) => node.raw.trim())
        .filter(Boolean);

    return sentences.length > 0 ? sentences : [text.trim()].filter(Boolean);
}

function tokenCount(text: string): number {
    return countTokens(text);
}

async function splitPageText(
    text: string,
    splitter: RecursiveCharacterTextSplitter,
    chunkTokenLimit: number
) {
    const sentenceChunks: string[] = [];
    let activeChunk = "";

    for (const sentence of getSentenceTexts(text)) {
        const candidate = activeChunk ? `${activeChunk} ${sentence}` : sentence;

        if (tokenCount(candidate) <= chunkTokenLimit) {
            activeChunk = candidate;
            continue;
        }

        if (activeChunk) {
            sentenceChunks.push(activeChunk);
        }

        if (tokenCount(sentence) > chunkTokenLimit) {
            sentenceChunks.push(...(await splitter.splitText(sentence)));
            activeChunk = "";
            continue;
        }

        activeChunk = sentence;
    }

    if (activeChunk) {
        sentenceChunks.push(activeChunk);
    }

    return sentenceChunks;
}

export async function createDocumentChunks(
    documentId: string,
    parseResult: ParserResult,
    options: DocumentChunkerOptions = {}
): Promise<SemanticDocumentChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkOverlap: options.chunkOverlap ?? defaultChunkOverlap,
        chunkSize: options.chunkSize ?? defaultChunkSize,
        lengthFunction: tokenCount,
    });
    const chunks: SemanticDocumentChunk[] = [];

    for (const page of parseResult.pages) {
        const splitTexts = await splitPageText(
            page.rawText,
            splitter,
            options.chunkSize ?? defaultChunkSize
        );
        const sectionTitle = inferSectionTitle(page.rawText);

        for (const content of splitTexts) {
            const trimmed = content.trim();

            if (trimmed.length === 0) {
                continue;
            }

            const metadata = buildDocumentChunkMetadata({
                documentId,
                page,
                parser: parseResult.metadata.parser,
                sectionTitle,
            });
            metadata.sentenceCount = getSentenceTexts(trimmed).length;
            metadata.tokenCount = tokenCount(trimmed);

            chunks.push({
                chunkIndex: chunks.length,
                chunkType: inferChunkType(trimmed),
                content: trimmed,
                metadata,
                pageNumber: page.pageNumber,
            });
        }
    }

    return chunks;
}
