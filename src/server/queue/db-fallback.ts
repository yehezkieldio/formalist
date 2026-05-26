import {
    claimNextIngestionJob,
    enqueueIngestionJob,
    recoverStaleRunningIngestionJobs,
    rescheduleIngestionJob,
    updateIngestionJobStatus,
} from "#/server/db/queries/ingestion-jobs";
import type { EnqueueIngestionJobInput } from "#/server/db/queries/ingestion-jobs";

import type { QueueAdapter, QueueJob, RetryQueueJobInput } from "./adapter";
import { normalizeQueuePayload, toQueueJob } from "./adapter";

type ClaimedDbJob = Awaited<ReturnType<typeof claimNextIngestionJob>>;
type EnqueueFn = (
    input: EnqueueIngestionJobInput
) => Promise<NonNullable<ClaimedDbJob>>;
type ClaimFn = (now?: Date) => Promise<ClaimedDbJob>;
type RecoverStaleFn = typeof recoverStaleRunningIngestionJobs;
type UpdateFn = typeof updateIngestionJobStatus;
type RescheduleFn = typeof rescheduleIngestionJob;

export interface DatabaseQueueAdapterDependencies {
    claim?: ClaimFn;
    enqueue?: EnqueueFn;
    recoverStale?: RecoverStaleFn;
    reschedule?: RescheduleFn;
    updateStatus?: UpdateFn;
}

function errorMessage(error: Error): string {
    return error.message || error.name;
}

export function createDatabaseQueueAdapter(
    dependencies: DatabaseQueueAdapterDependencies = {}
): QueueAdapter {
    const enqueue = dependencies.enqueue ?? enqueueIngestionJob;
    const claim = dependencies.claim ?? claimNextIngestionJob;
    const recoverStale =
        dependencies.recoverStale ?? recoverStaleRunningIngestionJobs;
    const updateStatus = dependencies.updateStatus ?? updateIngestionJobStatus;
    const reschedule = dependencies.reschedule ?? rescheduleIngestionJob;

    return {
        async claim() {
            const job = await claim(new Date());
            return job ? toQueueJob(job) : undefined;
        },
        async complete(job: QueueJob) {
            await updateStatus(job.id, "completed");
        },
        async enqueue(input) {
            const payload = normalizeQueuePayload(
                input.documentId,
                input.payload
            );
            const dbJobInput: EnqueueIngestionJobInput = {
                availableAt: input.availableAt,
                documentId: input.documentId,
                maxAttempts: input.maxAttempts,
                payload,
                type: input.type,
            };
            const job = await enqueue(dbJobInput);

            return toQueueJob(job);
        },
        async fail(job: QueueJob, error: Error) {
            await updateStatus(job.id, "failed", errorMessage(error));
        },
        name: "db-fallback",
        recoverStale,
        async retry(input: RetryQueueJobInput) {
            const availableAt = new Date(Date.now() + input.delayMs);
            await reschedule(
                input.job.id,
                availableAt,
                errorMessage(input.error)
            );
        },
        warnings: [],
    };
}
