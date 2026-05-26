import { describe, expect, it, vi } from "vitest";

import type { IngestionJobStatus } from "#/server/db/schema";
import { createDatabaseQueueAdapter } from "#/server/queue/db-fallback";

const documentId = "00000000-0000-0000-0000-000000000001";
const jobId = "00000000-0000-0000-0000-000000000002";

interface TestDbJob {
    attempts: number;
    availableAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    documentId: string;
    error: string | null;
    id: string;
    maxAttempts: number;
    payload: unknown;
    startedAt: Date | null;
    status: IngestionJobStatus;
    type: string;
    updatedAt: Date;
}

function dbJob(overrides: Partial<TestDbJob> = {}): TestDbJob {
    return {
        attempts: 0,
        availableAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        documentId,
        error: null,
        id: jobId,
        maxAttempts: 3,
        payload: { documentId },
        startedAt: null,
        status: "queued",
        type: "parse-document",
        updatedAt: new Date(),
        ...overrides,
    };
}

describe("database queue adapter", () => {
    it("enqueues a durable ingestion job", async () => {
        const enqueue = vi.fn(() => Promise.resolve(dbJob()));
        const adapter = createDatabaseQueueAdapter({ enqueue });

        const job = await adapter.enqueue({
            documentId,
            type: "parse-document",
        });

        expect(enqueue).toHaveBeenCalledWith({
            availableAt: undefined,
            documentId,
            maxAttempts: undefined,
            payload: { documentId },
            type: "parse-document",
        });
        expect(job).toMatchObject({
            documentId,
            id: jobId,
            payload: { documentId },
            type: "parse-document",
        });
    });

    it("claims the next queued job", async () => {
        const claim = vi.fn(() => Promise.resolve(dbJob({ attempts: 1 })));
        const adapter = createDatabaseQueueAdapter({ claim });

        await expect(adapter.claim()).resolves.toMatchObject({
            attempts: 1,
            id: jobId,
        });
        expect(claim).toHaveBeenCalledWith(expect.any(Date));
    });

    it("completes, fails, and retries jobs through database state", async () => {
        const recoverStale = vi.fn(() => Promise.resolve(2));
        const updateStatus = vi.fn(() =>
            Promise.resolve(dbJob({ status: "completed" }))
        );
        const reschedule = vi.fn(() =>
            Promise.resolve(dbJob({ status: "queued" }))
        );
        const adapter = createDatabaseQueueAdapter({
            recoverStale,
            reschedule,
            updateStatus,
        });
        const job = dbJob();
        const queueJob = {
            attempts: 1,
            documentId,
            id: job.id,
            maxAttempts: 3,
            payload: { documentId },
            type: "parse-document" as const,
        };

        await adapter.complete(queueJob);
        await adapter.fail(queueJob, new Error("parse failed"));
        await adapter.retry({
            delayMs: 1000,
            error: new Error("timeout"),
            job: queueJob,
        });
        const recovered = await adapter.recoverStale?.({
            staleBefore: new Date(0),
        });

        expect(updateStatus).toHaveBeenCalledWith(job.id, "completed");
        expect(updateStatus).toHaveBeenCalledWith(
            job.id,
            "failed",
            "parse failed"
        );
        expect(reschedule).toHaveBeenCalledWith(
            job.id,
            expect.any(Date),
            "timeout"
        );
        expect(recovered).toBe(2);
        expect(recoverStale).toHaveBeenCalledWith({
            staleBefore: new Date(0),
        });
    });
});
