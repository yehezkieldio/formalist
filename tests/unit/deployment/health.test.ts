import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    checkOpenRouterHealth,
    checkQueueHealth,
    checkUploadRootHealth,
    getHealthReport,
} from "#/server/deployment/health";

const temporaryDirectories: string[] = [];

afterEach(async () => {
    for (const directory of temporaryDirectories.splice(0)) {
        await rm(directory, { force: true, recursive: true });
    }
});

describe("deployment health checks", () => {
    it("reports missing OpenRouter key as degraded, not fatal", () => {
        expect(checkOpenRouterHealth({ OPENROUTER_API_KEY: "" })).toEqual({
            message:
                "OpenRouter key is missing; LLM extraction and chat will show setup-required states.",
            state: "degraded",
        });
    });

    it("reports configured OpenRouter key as ok", () => {
        expect(
            checkOpenRouterHealth({ OPENROUTER_API_KEY: "sk-test" })
        ).toEqual({
            message: "OpenRouter key is configured.",
            state: "ok",
        });
    });

    it("reports upload root inside public as an error", async () => {
        const result = await checkUploadRootHealth({
            UPLOAD_ROOT: path.join(process.cwd(), "public", "uploads"),
        });

        expect(result.state).toBe("error");
        expect(result.message).toContain("public web root");
    });

    it("reports writable upload root with storage flags", async () => {
        const directory = await mkdtemp(path.join(os.tmpdir(), "formalist-"));
        temporaryDirectories.push(directory);

        const result = await checkUploadRootHealth({
            STORE_DEBUG_ARTIFACTS: "true",
            STORE_ORIGINAL_FILES: "true",
            STORE_PAGE_IMAGES: "false",
            UPLOAD_ROOT: directory,
        });

        expect(result).toMatchObject({
            details: {
                storeDebugArtifacts: true,
                storeOriginalFiles: true,
                storePageImages: false,
                uploadRoot: directory,
            },
            state: "ok",
        });
    });

    it("reports queue fallback when requested Redis settings are missing", () => {
        expect(checkQueueHealth({ QUEUE_PROVIDER: "upstash-redis" })).toEqual({
            details: {
                provider: "db-fallback",
                requestedProvider: "upstash-redis",
            },
            message:
                "Upstash REST credentials are missing; use the database-backed queue.",
            state: "degraded",
        });
    });

    it("includes all top-level checks in the report without a database URL", async () => {
        const result = await getHealthReport({
            OPENROUTER_API_KEY: "",
            QUEUE_PROVIDER: "db-fallback",
            UPLOAD_ROOT: "/path/that/does/not/exist",
        });

        expect(Object.keys(result).toSorted()).toEqual([
            "database",
            "fullText",
            "openRouter",
            "queue",
            "storage",
            "vector",
        ]);
        expect(result.database.state).toBe("error");
        expect(result.fullText.state).toBe("degraded");
        expect(result.vector.state).toBe("degraded");
        expect(result.openRouter.state).toBe("degraded");
    });
});
