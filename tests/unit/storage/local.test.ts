import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    getDebugArtifactPath,
    getPageImagePath,
    saveDebugJson,
} from "#/server/ingestion/artifacts";
import {
    deleteOriginalFile,
    initializeUploadRoot,
    readOriginalFile,
    saveOriginalFile,
} from "#/server/storage/local";

const temporaryDirectories: string[] = [];

async function temporaryUploadRoot() {
    const directory = await mkdtemp(
        path.join(os.tmpdir(), "formalist-storage-")
    );
    temporaryDirectories.push(directory);

    return directory;
}

afterEach(async () => {
    for (const directory of temporaryDirectories.splice(0)) {
        await rm(directory, { force: true, recursive: true });
    }
});

describe("local storage", () => {
    it("initializes upload directories", async () => {
        const uploadRoot = await temporaryUploadRoot();

        await expect(
            initializeUploadRoot({ uploadRoot })
        ).resolves.toMatchObject({
            state: "ok",
            uploadRoot,
        });
    });

    it("does not save original files when disabled", async () => {
        const uploadRoot = await temporaryUploadRoot();

        await expect(
            saveOriginalFile({
                bytes: Buffer.from("pdf"),
                documentId: "doc-1",
                extension: "pdf",
                settings: { storeOriginalFiles: false, uploadRoot },
            })
        ).resolves.toBeUndefined();
    });

    it("saves, reads, and deletes original files when enabled", async () => {
        const uploadRoot = await temporaryUploadRoot();
        const filePath = await saveOriginalFile({
            bytes: Buffer.from("pdf"),
            documentId: "doc-1",
            extension: "pdf",
            settings: { storeOriginalFiles: true, uploadRoot },
        });

        expect(filePath).toBeDefined();
        await expect(readOriginalFile(filePath as string)).resolves.toEqual(
            Buffer.from("pdf")
        );
        await deleteOriginalFile(filePath as string);
        await expect(readOriginalFile(filePath as string)).rejects.toThrow();
    });

    it("gates page images and debug artifacts by settings", async () => {
        const uploadRoot = await temporaryUploadRoot();

        expect(
            getPageImagePath({ storePageImages: false, uploadRoot }, "doc-1", 1)
        ).toBeUndefined();
        expect(
            getDebugArtifactPath(
                { storeDebugArtifacts: false, uploadRoot },
                "doc-1",
                "trace.json"
            )
        ).toBeUndefined();
    });

    it("persists debug JSON only when enabled", async () => {
        const uploadRoot = await temporaryUploadRoot();
        const filePath = await saveDebugJson({
            documentId: "doc-1",
            payload: { ok: true },
            settings: { storeDebugArtifacts: true, uploadRoot },
        });

        expect(filePath).toBeDefined();
        await expect(readFile(filePath as string, "utf-8")).resolves.toContain(
            '"ok": true'
        );
    });
});
