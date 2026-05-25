import { Redis } from "@upstash/redis";

import type { QueueAdapter } from "./adapter";
import { QueueAdapterError } from "./adapter";

export const upstashQueueFallbackMessage =
    "Upstash Redis REST is available for lightweight Redis commands, but Formalist uses the database fallback queue for ingestion workers because BullMQ requires a Redis connection with worker semantics.";

export interface UpstashRedisQueueAdapterOptions {
    token: string;
    url: string;
}

export function createUpstashRedisClient(
    options: UpstashRedisQueueAdapterOptions
) {
    return new Redis({
        token: options.token,
        url: options.url,
    });
}

function fallbackError(): QueueAdapterError {
    return new QueueAdapterError(upstashQueueFallbackMessage);
}

export function createUpstashRedisQueueAdapter(
    options: UpstashRedisQueueAdapterOptions
): QueueAdapter {
    createUpstashRedisClient(options);

    return {
        claim() {
            return Promise.reject(fallbackError());
        },
        complete() {
            return Promise.reject(fallbackError());
        },
        enqueue() {
            return Promise.reject(fallbackError());
        },
        fail() {
            return Promise.reject(fallbackError());
        },
        name: "upstash-redis",
        retry() {
            return Promise.reject(fallbackError());
        },
        warnings: [
            {
                code: "upstash-db-fallback-required",
                message: upstashQueueFallbackMessage,
            },
        ],
    };
}
