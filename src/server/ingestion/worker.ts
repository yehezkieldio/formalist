import { setTimeout as wait } from "node:timers/promises";

import { createQueueAdapter } from "#/server/queue";
import type { QueueAdapter, QueueWorkerHandle } from "#/server/queue/adapter";

import { handleIngestionError } from "./errors";
import { dispatchIngestionJob } from "./pipeline";

const defaultPollIntervalMs = 5000;

export interface IngestionWorkerOptions {
    adapter?: QueueAdapter;
    once?: boolean;
    pollIntervalMs?: number;
    signal?: AbortSignal;
}

export interface IngestionWorkerResult {
    handled: number;
}

export async function runIngestionWorkerOnce(
    adapter: QueueAdapter
): Promise<IngestionWorkerResult> {
    const job = await adapter.claim();

    if (!job) {
        return { handled: 0 };
    }

    try {
        await dispatchIngestionJob(job);
        await adapter.complete(job);
    } catch (error) {
        await handleIngestionError({ adapter, error, job });
    }

    return { handled: 1 };
}

async function startPollingWorker(input: {
    adapter: QueueAdapter;
    pollIntervalMs: number;
    signal?: AbortSignal;
}): Promise<IngestionWorkerResult> {
    let handled = 0;

    while (!input.signal?.aborted) {
        const result = await runIngestionWorkerOnce(input.adapter);
        handled += result.handled;

        if (result.handled === 0) {
            try {
                await wait(input.pollIntervalMs, undefined, {
                    signal: input.signal,
                });
            } catch (error) {
                if ((error as { name?: string }).name !== "AbortError") {
                    throw error;
                }
            }
        }
    }

    return { handled };
}

export function startIngestionWorker(
    options: IngestionWorkerOptions = {}
): Promise<IngestionWorkerResult | QueueWorkerHandle> {
    const adapter = options.adapter ?? createQueueAdapter();

    if (options.once) {
        return runIngestionWorkerOnce(adapter);
    }

    if (adapter.startWorker) {
        return adapter.startWorker(
            async (job) => {
                try {
                    await dispatchIngestionJob(job);
                    await adapter.complete(job);
                } catch (error) {
                    await handleIngestionError({ adapter, error, job });
                }
            },
            { signal: options.signal }
        );
    }

    return startPollingWorker({
        adapter,
        pollIntervalMs: options.pollIntervalMs ?? defaultPollIntervalMs,
        signal: options.signal,
    });
}
