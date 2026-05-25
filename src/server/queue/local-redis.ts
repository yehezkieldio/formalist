import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

import type {
    EnqueueQueueJobInput,
    QueueAdapter,
    QueueJob,
    QueueJobHandler,
    QueueWorkerContext,
} from "./adapter";
import { QueueAdapterError } from "./adapter";
import { createDatabaseQueueAdapter } from "./db-fallback";

export const ingestionQueueName = "formalist:ingestion";
const defaultRetryDelayMs = 1000;
const defaultWorkerConcurrency = 2;
const redisRetryMaxDelayMs = 20_000;
const redisRetryMinDelayMs = 1000;

export interface LocalRedisQueueAdapterOptions {
    concurrency?: number;
    redisUrl: string;
}

export function createBullMqConnection(redisUrl: string) {
    return new IORedis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        retryStrategy(times) {
            return Math.max(
                Math.min(Math.exp(times), redisRetryMaxDelayMs),
                redisRetryMinDelayMs
            );
        },
    });
}

export function buildBullMqJobOptions(input: EnqueueQueueJobInput) {
    return {
        attempts: input.maxAttempts ?? 3,
        backoff: {
            delay: defaultRetryDelayMs,
            jitter: 0.25,
            type: "exponential" as const,
        },
        jobId: undefined as string | undefined,
        removeOnComplete: 100,
        removeOnFail: 500,
    };
}

function assertRedisUrl(redisUrl: string): void {
    if (redisUrl.trim().length === 0) {
        throw new QueueAdapterError(
            "REDIS_URL is required for local Redis queue"
        );
    }
}

export function createLocalRedisQueueAdapter(
    options: LocalRedisQueueAdapterOptions
): QueueAdapter {
    assertRedisUrl(options.redisUrl);

    const dbAdapter = createDatabaseQueueAdapter();
    const connection = createBullMqConnection(options.redisUrl);
    const queue = new Queue<QueueJob>(ingestionQueueName, { connection });

    async function enqueue(input: EnqueueQueueJobInput): Promise<QueueJob> {
        const job = await dbAdapter.enqueue(input);
        await queue.add(job.type, job, {
            ...buildBullMqJobOptions(input),
            jobId: job.id,
        });

        return job;
    }

    function startWorker(
        handler: QueueJobHandler,
        context: QueueWorkerContext = {}
    ) {
        const worker = new Worker<QueueJob>(
            ingestionQueueName,
            async (bullJob) => {
                await handler(bullJob.data, context);
            },
            {
                concurrency: options.concurrency ?? defaultWorkerConcurrency,
                connection,
            }
        );

        return Promise.resolve({
            async close() {
                await worker.close();
            },
        });
    }

    return {
        claim: dbAdapter.claim,
        async close() {
            await queue.close();
            connection.disconnect();
        },
        complete: dbAdapter.complete,
        enqueue,
        fail: dbAdapter.fail,
        name: "local-redis",
        recoverStale: dbAdapter.recoverStale,
        retry: dbAdapter.retry,
        startWorker,
        warnings: [],
    };
}
