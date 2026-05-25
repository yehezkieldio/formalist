import { getDeploymentConfig } from "#/server/deployment/mode";
import type { QueueProvider } from "#/server/deployment/mode";

export interface QueueProviderInput {
    [key: string]: string | undefined;
    QUEUE_PROVIDER?: string;
    REDIS_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
}

export interface QueueProviderConfig {
    provider: QueueProvider;
    reason?: string;
    redisUrl?: string;
    upstashRestToken?: string;
    upstashRestUrl?: string;
}

function isPresent(value: string | undefined): value is string {
    return Boolean(value && value.trim().length > 0);
}

export function getQueueProviderConfig(
    input: QueueProviderInput = process.env
): QueueProviderConfig {
    const { queueProvider } = getDeploymentConfig(input);

    if (queueProvider === "local-redis") {
        return {
            provider: isPresent(input.REDIS_URL)
                ? "local-redis"
                : "db-fallback",
            reason: isPresent(input.REDIS_URL)
                ? undefined
                : "REDIS_URL is missing; use the database-backed queue.",
            redisUrl: input.REDIS_URL,
        };
    }

    if (queueProvider === "upstash-redis") {
        const hasUpstash =
            isPresent(input.UPSTASH_REDIS_REST_URL) &&
            isPresent(input.UPSTASH_REDIS_REST_TOKEN);

        return {
            provider: hasUpstash ? "upstash-redis" : "db-fallback",
            reason: hasUpstash
                ? undefined
                : "Upstash REST credentials are missing; use the database-backed queue.",
            upstashRestToken: input.UPSTASH_REDIS_REST_TOKEN,
            upstashRestUrl: input.UPSTASH_REDIS_REST_URL,
        };
    }

    return { provider: "db-fallback" };
}
