import {
    listDocumentChunksForExtraction,
    listTableChunksForExtraction,
} from "#/server/db/queries/chunks";
import { getDocument } from "#/server/db/queries/documents";
import { createQueueAdapter } from "#/server/queue";
import type { QueueJob } from "#/server/queue/adapter";
import {
    getLocalStorageSettings,
    readOriginalFile,
} from "#/server/storage/local";

import { saveParseDebugArtifact } from "./artifacts";
import { createDocumentChunks } from "./chunkers/document-chunker";
import { createTableChunks } from "./chunkers/table-chunker";
import { extractStructuredRecords } from "./extractors";
import {
    isExtractionSetupRequired,
    markExtractionSetupRequired,
} from "./extractors/policy";
import { parseDocument } from "./parsers";
import type { ParserResult } from "./parsers/types";
import { persistDocumentChunks } from "./persist-chunks";
import { persistStructuredExtraction } from "./persist-extracted";
import { persistParsedPages } from "./persist-pages";
import { persistTableChunks } from "./persist-table-chunks";
import { setIngestionDocumentStatus } from "./status";
import { validateExtraction } from "./validators";

interface ChunkJobPayload {
    parseResult?: ParserResult;
}

function assertChunkPayload(payload: QueueJob["payload"]): ParserResult {
    const chunkPayload = payload as ChunkJobPayload;

    if (!chunkPayload.parseResult) {
        throw new Error("chunk-document job requires parseResult payload.");
    }

    return chunkPayload.parseResult;
}

async function handleParseDocument(job: QueueJob) {
    await setIngestionDocumentStatus({ job, status: "parsing" });

    const document = await getDocument(job.documentId);

    if (!document?.originalPath) {
        throw new Error(
            "Document original file is required for async parsing."
        );
    }

    const bytes = await readOriginalFile(document.originalPath);
    const parseResult = await parseDocument({
        bytes,
        documentId: document.id,
        fileType: document.fileType,
        filename: document.filename,
        mimeType: document.mimeType,
    });
    await persistParsedPages({ documentId: document.id, parseResult });
    await saveParseDebugArtifact({
        documentId: document.id,
        parseResult,
        settings: getLocalStorageSettings(),
    });
    await createQueueAdapter().enqueue({
        documentId: document.id,
        payload: { documentId: document.id, parseResult },
        type: "chunk-document",
    });
}

async function handleChunkDocument(job: QueueJob) {
    const parseResult = assertChunkPayload(job.payload);
    const queue = createQueueAdapter();
    const documentChunks = await createDocumentChunks(
        job.documentId,
        parseResult
    );
    const tableChunks = createTableChunks(job.documentId, parseResult);

    await persistDocumentChunks(job.documentId, documentChunks);
    await persistTableChunks(job.documentId, tableChunks);
    await setIngestionDocumentStatus({ job, status: "chunked" });
    await queue.enqueue({
        documentId: job.documentId,
        payload: { documentId: job.documentId, parseResult },
        type: "extract-structured-data",
    });
}

async function handleExtractStructuredData(job: QueueJob) {
    const parseResult = assertChunkPayload(job.payload);
    const queue = createQueueAdapter();
    const [documentChunks, tableChunks] = await Promise.all([
        listDocumentChunksForExtraction(job.documentId),
        listTableChunksForExtraction(job.documentId),
    ]);

    let extraction;

    try {
        extraction = await extractStructuredRecords(parseResult, {
            documentChunks,
            tableChunks,
        });
    } catch (error) {
        if (isExtractionSetupRequired(error)) {
            await markExtractionSetupRequired(job);
            return;
        }

        throw error;
    }

    await persistStructuredExtraction({
        documentId: job.documentId,
        extraction,
    });
    await setIngestionDocumentStatus({ job, status: "extracted" });
    await queue.enqueue({
        documentId: job.documentId,
        payload: { documentId: job.documentId },
        type: "validate-extraction",
    });
    await queue.enqueue({
        documentId: job.documentId,
        payload: { documentId: job.documentId },
        type: "embed-sources",
    });
}

export async function dispatchIngestionJob(job: QueueJob) {
    if (job.type === "parse-document") {
        await handleParseDocument(job);
        return;
    }

    if (job.type === "chunk-document") {
        await handleChunkDocument(job);
        return;
    }

    if (job.type === "extract-structured-data") {
        await handleExtractStructuredData(job);
        return;
    }

    if (job.type === "validate-extraction") {
        await validateExtraction(job.documentId);
        await setIngestionDocumentStatus({ job, status: "needs_review" });
        return;
    }

    if (job.type === "embed-sources") {
        return;
    }

    const exhaustiveCheck: never = job.type;
    throw new Error(`Unsupported ingestion job type: ${exhaustiveCheck}`);
}
