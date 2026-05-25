import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "#/env";
import {
    assertUploadRootIsPrivate,
    originalFilePath,
    resolveUploadRoot,
} from "#/server/storage/paths";

export interface LocalStorageSettings {
    storeDebugArtifacts: boolean;
    storeOriginalFiles: boolean;
    storePageImages: boolean;
    uploadRoot: string;
}

export interface UploadRootStatus {
    message: string;
    state: "ok" | "warning";
    uploadRoot: string;
}

export function getLocalStorageSettings(): LocalStorageSettings {
    return {
        storeDebugArtifacts: env.STORE_DEBUG_ARTIFACTS,
        storeOriginalFiles: env.STORE_ORIGINAL_FILES,
        storePageImages: env.STORE_PAGE_IMAGES,
        uploadRoot: env.UPLOAD_ROOT,
    };
}

export async function initializeUploadRoot(
    settings: Pick<LocalStorageSettings, "uploadRoot">
): Promise<UploadRootStatus> {
    const uploadRoot = resolveUploadRoot(settings.uploadRoot);
    assertUploadRootIsPrivate(uploadRoot);

    try {
        await mkdir(uploadRoot, { recursive: true });
        await mkdir(path.join(uploadRoot, "original"), { recursive: true });
        await mkdir(path.join(uploadRoot, "pages"), { recursive: true });
        await mkdir(path.join(uploadRoot, "extracted"), { recursive: true });
        await mkdir(path.join(uploadRoot, "debug"), { recursive: true });

        return {
            message: "Upload root is initialized.",
            state: "ok",
            uploadRoot,
        };
    } catch (error) {
        return {
            message: error instanceof Error ? error.message : String(error),
            state: "warning",
            uploadRoot,
        };
    }
}

export async function saveOriginalFile(input: {
    bytes: Buffer | Uint8Array;
    documentId: string;
    extension: string;
    settings: Pick<LocalStorageSettings, "storeOriginalFiles" | "uploadRoot">;
}): Promise<string | undefined> {
    if (!input.settings.storeOriginalFiles) {
        return;
    }

    const filePath = originalFilePath(
        { uploadRoot: input.settings.uploadRoot },
        input.documentId,
        input.extension
    );
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.bytes);

    return filePath;
}

export function readOriginalFile(filePath: string): Promise<Buffer> {
    return readFile(filePath);
}

export async function deleteOriginalFile(filePath: string): Promise<void> {
    await rm(filePath, { force: true });
}
