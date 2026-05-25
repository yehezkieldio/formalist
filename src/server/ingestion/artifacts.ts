import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LocalStorageSettings } from "#/server/storage/local";
import {
    debugArtifactPath,
    extractedArtifactPath,
    pageImagePath,
} from "#/server/storage/paths";

export function getPageImagePath(
    settings: Pick<LocalStorageSettings, "storePageImages" | "uploadRoot">,
    documentId: string,
    pageNumber: number
): string | undefined {
    if (!settings.storePageImages) {
        return;
    }

    return pageImagePath(
        { uploadRoot: settings.uploadRoot },
        documentId,
        pageNumber
    );
}

export function getExtractedArtifactPath(
    settings: Pick<LocalStorageSettings, "storeDebugArtifacts" | "uploadRoot">,
    documentId: string,
    filename?: string
): string | undefined {
    if (!settings.storeDebugArtifacts) {
        return;
    }

    return extractedArtifactPath(
        { uploadRoot: settings.uploadRoot },
        documentId,
        filename
    );
}

export function getDebugArtifactPath(
    settings: Pick<LocalStorageSettings, "storeDebugArtifacts" | "uploadRoot">,
    documentId: string,
    filename: string
): string | undefined {
    if (!settings.storeDebugArtifacts) {
        return;
    }

    return debugArtifactPath(
        { uploadRoot: settings.uploadRoot },
        documentId,
        filename
    );
}

export async function saveDebugJson(input: {
    documentId: string;
    payload: unknown;
    settings: Pick<LocalStorageSettings, "storeDebugArtifacts" | "uploadRoot">;
}): Promise<string | undefined> {
    const filePath = getExtractedArtifactPath(
        input.settings,
        input.documentId,
        "raw.json"
    );

    if (!filePath) {
        return;
    }

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(input.payload, null, 2)}\n`);

    return filePath;
}
