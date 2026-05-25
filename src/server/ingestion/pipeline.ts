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
import { parseDocument } from "./parsers";
import type { ParserResult } from "./parsers/types";
import { persistDocumentChunks } from "./persist-chunks";
import { persistParsedPages } from "./persist-pages";
import { persistTableChunks } from "./persist-table-chunks";
import { setIngestionDocumentStatus } from "./status";

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
    const documentChunks = await createDocumentChunks(
        job.documentId,
        parseResult
    );
    const tableChunks = createTableChunks(job.documentId, parseResult);

    await persistDocumentChunks(job.documentId, documentChunks);
    await persistTableChunks(job.documentId, tableChunks);
    await setIngestionDocumentStatus({ job, status: "chunked" });
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
        await setIngestionDocumentStatus({ job, status: "extracted" });
        return;
    }

    if (job.type === "validate-extraction") {
        await setIngestionDocumentStatus({ job, status: "needs_review" });
        return;
    }

    if (job.type === "embed-sources") {
        return;
    }

    const exhaustiveCheck: never = job.type;
    throw new Error(`Unsupported ingestion job type: ${exhaustiveCheck}`);
}
