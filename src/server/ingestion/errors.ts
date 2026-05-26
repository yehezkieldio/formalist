import type { QueueAdapter, QueueJob } from "#/server/queue/adapter";

import { setIngestionDocumentStatus } from "./status";

const baseRetryDelayMs = 1000;
const maxRetryDelayMs = 60_000;

const retryableErrorPatterns = [
    /timeout/iu,
    /temporar/iu,
    /rate limit/iu,
    /connection/iu,
    /econnreset/iu,
    /etimedout/iu,
] as const;

export function normalizeIngestionError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    return new Error(String(error));
}

export function isRetryableIngestionError(error: Error): boolean {
    const message = `${error.name} ${error.message}`;
    return retryableErrorPatterns.some((pattern) => pattern.test(message));
}

export function calculateRetryDelayMs(attempts: number): number {
    const exponent = Math.max(attempts - 1, 0);
    const delay = baseRetryDelayMs * 2 ** exponent;
    return Math.min(delay, maxRetryDelayMs);
}

export async function handleIngestionError(input: {
    adapter: QueueAdapter;
    error: unknown;
    job: QueueJob;
}) {
    const error = normalizeIngestionError(input.error);
    const hasAttemptsRemaining = input.job.attempts < input.job.maxAttempts;
    const shouldRetry =
        hasAttemptsRemaining && isRetryableIngestionError(error);

    if (shouldRetry) {
        await input.adapter.retry({
            delayMs: calculateRetryDelayMs(input.job.attempts),
            error,
            job: input.job,
        });
        return;
    }

    await input.adapter.fail(input.job, error);
    await setIngestionDocumentStatus({
        error: error.message,
        job: input.job,
        status: "failed",
    });
}
