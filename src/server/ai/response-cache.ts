import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

import { env } from "#/env";

import type { ClassifiedIntent } from "./tools/classify-intent";

const cachePrefix = "formalist:response-cache:v1";
const defaultTtlSeconds = 10 * 60;

export interface CachedChatResponse {
    content: string;
    intent: ClassifiedIntent;
    mode: "general_rag" | "verified_numeric";
    warnings: string[];
}

type CacheClient =
    | {
          get: (key: string) => Promise<string | null>;
          setex: (
              key: string,
              seconds: number,
              value: string
          ) => Promise<unknown>;
      }
    | {
          get: <T>(key: string) => Promise<T | null>;
          set: (
              key: string,
              value: string,
              options: { ex: number }
          ) => Promise<unknown>;
      };

let localRedis: IORedis | undefined;
let upstashRedis: UpstashRedis | undefined;

function normalizeQuery(query: string) {
    return query.trim().toLowerCase().replaceAll(/\s+/gu, " ");
}

export async function createResponseCacheKey(input: {
    intent: ClassifiedIntent;
    query: string;
}) {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(
            JSON.stringify({
                intent: input.intent,
                query: normalizeQuery(input.query),
            })
        )
    );
    const digest = [...new Uint8Array(hash)]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");

    return `${cachePrefix}:${digest}`;
}

function getCacheClient(): CacheClient | null {
    if (env.QUEUE_PROVIDER === "local-redis" && env.REDIS_URL) {
        localRedis ??= new IORedis(env.REDIS_URL, {
            maxRetriesPerRequest: 1,
        });

        return localRedis;
    }

    if (
        env.QUEUE_PROVIDER === "upstash-redis" &&
        env.UPSTASH_REDIS_REST_URL &&
        env.UPSTASH_REDIS_REST_TOKEN
    ) {
        upstashRedis ??= new UpstashRedis({
            token: env.UPSTASH_REDIS_REST_TOKEN,
            url: env.UPSTASH_REDIS_REST_URL,
        });

        return upstashRedis;
    }

    return null;
}

export async function getCachedChatResponse(key: string) {
    const client = getCacheClient();

    if (!client) {
        return null;
    }

    try {
        const value = await client.get<CachedChatResponse>(key);

        if (!value) {
            return null;
        }

        return typeof value === "string"
            ? (JSON.parse(value) as CachedChatResponse)
            : value;
    } catch {
        return null;
    }
}

export async function setCachedChatResponse(
    key: string,
    value: CachedChatResponse,
    ttlSeconds = defaultTtlSeconds
) {
    const client = getCacheClient();

    if (!client || value.content.trim().length === 0) {
        return;
    }

    try {
        if ("setex" in client) {
            await client.setex(key, ttlSeconds, JSON.stringify(value));
            return;
        }

        await client.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch {
        // Cache is an optimization; failures must not block chat.
    }
}
