import { describe, expect, it } from "vitest";

import { getDatabaseProviderConfig } from "#/server/db/provider";
import {
    getDeploymentConfig,
    parseDatabaseProvider,
    parseDeploymentMode,
    parseQueueProvider,
} from "#/server/deployment/mode";
import { getQueueProviderConfig } from "#/server/queue/provider";

describe("deployment mode parsing", () => {
    it("defaults to docker local with Postgres and DB fallback queue", () => {
        expect(getDeploymentConfig({})).toEqual({
            databaseProvider: "postgres",
            deploymentMode: "docker-local",
            queueProvider: "db-fallback",
        });
    });

    it("accepts managed fallback mode", () => {
        expect(parseDeploymentMode("managed-fallback")).toBe(
            "managed-fallback"
        );
    });

    it("rejects invalid deployment modes", () => {
        expect(() => parseDeploymentMode("serverless-only")).toThrow();
    });

    it("rejects invalid database and queue providers", () => {
        expect(() => parseDatabaseProvider("sqlite")).toThrow();
        expect(() => parseQueueProvider("sqs")).toThrow();
    });
});

describe("provider selection", () => {
    it("uses DATABASE_URL for local Postgres", () => {
        expect(
            getDatabaseProviderConfig({
                DATABASE_PROVIDER: "postgres",
                DATABASE_URL: "postgres://local",
                SUPABASE_DATABASE_URL: "postgres://supabase",
            })
        ).toEqual({
            connectionUrl: "postgres://local",
            provider: "postgres",
        });
    });

    it("prefers SUPABASE_DATABASE_URL for Supabase provider", () => {
        expect(
            getDatabaseProviderConfig({
                DATABASE_PROVIDER: "supabase",
                DATABASE_URL: "postgres://fallback",
                SUPABASE_DATABASE_URL: "postgres://supabase",
            })
        ).toEqual({
            connectionUrl: "postgres://supabase",
            provider: "supabase",
        });
    });

    it("falls back to database queue when local Redis is missing", () => {
        const result = getQueueProviderConfig({
            QUEUE_PROVIDER: "local-redis",
        });

        expect(result).toMatchObject({
            provider: "db-fallback",
            reason: "REDIS_URL is missing; use the database-backed queue.",
        });
        expect(result.redisUrl).toBeUndefined();
    });

    it("selects Upstash Redis when REST credentials are present", () => {
        const result = getQueueProviderConfig({
            QUEUE_PROVIDER: "upstash-redis",
            UPSTASH_REDIS_REST_TOKEN: "token",
            UPSTASH_REDIS_REST_URL: "https://upstash.example",
        });

        expect(result).toEqual({
            provider: "upstash-redis",
            upstashRestToken: "token",
            upstashRestUrl: "https://upstash.example",
        });
        expect(result.reason).toBeUndefined();
    });
});
