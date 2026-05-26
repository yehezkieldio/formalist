import {
    createDocument,
    updateDocumentOriginalPath,
} from "#/server/db/queries/documents";
import { createQueueAdapter } from "#/server/queue";
import { checksumBuffer } from "#/server/storage/checksum";
import { saveOriginalFile } from "#/server/storage/local";
import type { LocalStorageSettings } from "#/server/storage/local";

export interface CreateUploadedDocumentInput {
    bytes: Buffer;
    extension: string;
    filename: string;
    mimeType: string;
    settings: Pick<LocalStorageSettings, "storeOriginalFiles" | "uploadRoot">;
    sourceName?: string;
    storePageImages: boolean;
}

export async function createUploadedDocument(
    input: CreateUploadedDocumentInput
) {
    const checksum = checksumBuffer(input.bytes);
    const document = await createDocument({
        checksum,
        fileType: input.extension,
        filename: input.filename,
        mimeType: input.mimeType,
        originalPath: undefined,
        sourceName: input.sourceName,
        status: "uploaded",
        storeOriginalFile: input.settings.storeOriginalFiles,
        storePageImages: input.storePageImages,
    });
    const originalPath = await saveOriginalFile({
        bytes: input.bytes,
        documentId: document.id,
        extension: input.extension,
        settings: input.settings,
    });

    const updatedDocument = originalPath
        ? await updateDocumentOriginalPath(document.id, originalPath)
        : document;

    const queue = createQueueAdapter();
    const job = await queue.enqueue({
        documentId: updatedDocument.id,
        payload: { documentId: updatedDocument.id },
        type: "parse-document",
    });

    return { document: updatedDocument, job };
}
