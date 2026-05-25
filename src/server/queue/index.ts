import { getQueueProviderConfig } from "#/server/queue/provider";
import type { QueueProviderConfig } from "#/server/queue/provider";

import type { QueueAdapter } from "./adapter";
import { QueueAdapterError } from "./adapter";
import { createDatabaseQueueAdapter } from "./db-fallback";
import { createLocalRedisQueueAdapter } from "./local-redis";
import { upstashQueueFallbackMessage } from "./upstash-redis";

export interface QueueAdapterFactoryInput {
    config?: QueueProviderConfig;
}

function requireRedisUrl(redisUrl: string | undefined): string {
    if (!redisUrl) {
        throw new QueueAdapterError(
            "REDIS_URL is required for local Redis queue"
        );
    }

    return redisUrl;
}

export function createQueueAdapter(
    input: QueueAdapterFactoryInput = {}
): QueueAdapter {
    const config = input.config ?? getQueueProviderConfig();

    if (config.provider === "local-redis") {
        return createLocalRedisQueueAdapter({
            redisUrl: requireRedisUrl(config.redisUrl),
        });
    }

    const adapter = createDatabaseQueueAdapter();

    if (config.provider === "upstash-redis") {
        return {
            ...adapter,
            name: "db-fallback",
            warnings: [
                ...adapter.warnings,
                {
                    code: "upstash-db-fallback-required",
                    message: upstashQueueFallbackMessage,
                },
            ],
        };
    }

    if (config.reason) {
        return {
            ...adapter,
            warnings: [
                ...adapter.warnings,
                {
                    code: "provider-fallback",
                    message: config.reason,
                },
            ],
        };
    }

    return adapter;
}
