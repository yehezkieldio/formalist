import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { saveParseDebugArtifact } from "#/server/ingestion/artifacts";
import type { ParserResult } from "#/server/ingestion/parsers/types";

const parseResult: ParserResult = {
    metadata: {
        parser: "txt",
        sourceFilename: "tariff.txt",
    },
    pages: [
        {
            pageNumber: 1,
            rawText: "Tariff",
        },
    ],
    rawText: "Tariff",
    tableLikeBlocks: [],
    warnings: [],
};

describe("parse debug artifacts", () => {
    it("saves raw parse JSON only when debug artifacts are enabled", async () => {
        const uploadRoot = await mkdtemp(
            path.join(os.tmpdir(), "formalist-parser-")
        );

        try {
            await expect(
                saveParseDebugArtifact({
                    documentId: "doc-1",
                    parseResult,
                    settings: {
                        storeDebugArtifacts: false,
                        uploadRoot,
                    },
                })
            ).resolves.toBeUndefined();
            await expect(
                saveParseDebugArtifact({
                    documentId: "doc-1",
                    parseResult,
                    settings: {
                        storeDebugArtifacts: true,
                        uploadRoot,
                    },
                })
            ).resolves.toContain("raw.json");
        } finally {
            await rm(uploadRoot, { force: true, recursive: true });
        }
    });
});
