import { describe, expect, it } from "vitest";

import { getDatabaseProviderConfig } from "#/server/db/provider";
import { checkOpenRouterHealth } from "#/server/deployment/health";
import { getDeploymentConfig } from "#/server/deployment/mode";
import { getQueueProviderConfig } from "#/server/queue/provider";

describe("managed fallback deployment configuration", () => {
    it("selects Supabase Postgres, Upstash fallback queue, and degraded OpenRouter state from env", () => {
        const previousDeploymentMode = process.env.DEPLOYMENT_MODE;
        const previousDatabaseProvider = process.env.DATABASE_PROVIDER;
        const previousDatabaseUrl = process.env.DATABASE_URL;
        const previousSupabaseDatabaseUrl = process.env.SUPABASE_DATABASE_URL;
        const previousQueueProvider = process.env.QUEUE_PROVIDER;
        const previousUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
        const previousUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        const previousOpenRouterKey = process.env.OPENROUTER_API_KEY;

        process.env.DEPLOYMENT_MODE = "managed-fallback";
        process.env.DATABASE_PROVIDER = "supabase";
        process.env.DATABASE_URL = "postgres://local";
        process.env.SUPABASE_DATABASE_URL = "postgres://supabase";
        process.env.QUEUE_PROVIDER = "upstash-redis";
        process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
        process.env.UPSTASH_REDIS_REST_TOKEN = "token";
        process.env.OPENROUTER_API_KEY = "";

        try {
            expect(getDeploymentConfig().deploymentMode).toBe(
                "managed-fallback"
            );
            expect(getDatabaseProviderConfig().connectionUrl).toBe(
                "postgres://supabase"
            );
            expect(getQueueProviderConfig().provider).toBe("upstash-redis");
            expect(checkOpenRouterHealth().state).toBe("degraded");
        } finally {
            if (previousDeploymentMode === undefined) {
                delete process.env.DEPLOYMENT_MODE;
            } else {
                process.env.DEPLOYMENT_MODE = previousDeploymentMode;
            }
            if (previousDatabaseProvider === undefined) {
                delete process.env.DATABASE_PROVIDER;
            } else {
                process.env.DATABASE_PROVIDER = previousDatabaseProvider;
            }
            if (previousDatabaseUrl === undefined) {
                delete process.env.DATABASE_URL;
            } else {
                process.env.DATABASE_URL = previousDatabaseUrl;
            }
            if (previousSupabaseDatabaseUrl === undefined) {
                delete process.env.SUPABASE_DATABASE_URL;
            } else {
                process.env.SUPABASE_DATABASE_URL = previousSupabaseDatabaseUrl;
            }
            if (previousQueueProvider === undefined) {
                delete process.env.QUEUE_PROVIDER;
            } else {
                process.env.QUEUE_PROVIDER = previousQueueProvider;
            }
            if (previousUpstashUrl === undefined) {
                delete process.env.UPSTASH_REDIS_REST_URL;
            } else {
                process.env.UPSTASH_REDIS_REST_URL = previousUpstashUrl;
            }
            if (previousUpstashToken === undefined) {
                delete process.env.UPSTASH_REDIS_REST_TOKEN;
            } else {
                process.env.UPSTASH_REDIS_REST_TOKEN = previousUpstashToken;
            }
            if (previousOpenRouterKey === undefined) {
                delete process.env.OPENROUTER_API_KEY;
            } else {
                process.env.OPENROUTER_API_KEY = previousOpenRouterKey;
            }
        }
    });
});
