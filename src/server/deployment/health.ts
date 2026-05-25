import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import { Client } from "pg";

import { getDatabaseProviderConfig } from "#/server/db/provider";
import { getQueueProviderConfig } from "#/server/queue/provider";

export type HealthState = "ok" | "degraded" | "error";

export interface HealthCheckResult {
    details?: Record<string, unknown>;
    message: string;
    state: HealthState;
}

export interface HealthReport {
    database: HealthCheckResult;
    fullText: HealthCheckResult;
    openRouter: HealthCheckResult;
    queue: HealthCheckResult;
    storage: HealthCheckResult;
    vector: HealthCheckResult;
}

export interface HealthInput {
    [key: string]: string | undefined;
    DATABASE_PROVIDER?: string;
    DATABASE_URL?: string;
    OPENROUTER_API_KEY?: string;
    QUEUE_PROVIDER?: string;
    REDIS_URL?: string;
    STORE_DEBUG_ARTIFACTS?: string;
    STORE_ORIGINAL_FILES?: string;
    STORE_PAGE_IMAGES?: string;
    SUPABASE_DATABASE_URL?: string;
    UPLOAD_ROOT?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    UPSTASH_REDIS_REST_URL?: string;
}

function isEnabled(value: string | undefined): boolean {
    return value === "true";
}

function isInsidePublicRoot(uploadRoot: string): boolean {
    const publicRoot = path.resolve(process.cwd(), "public");
    const resolvedUploadRoot = path.resolve(uploadRoot);

    return (
        resolvedUploadRoot === publicRoot ||
        resolvedUploadRoot.startsWith(`${publicRoot}${path.sep}`)
    );
}

export async function checkUploadRootHealth(
    input: HealthInput = process.env
): Promise<HealthCheckResult> {
    const uploadRoot = input.UPLOAD_ROOT ?? "/data/uploads";

    if (isInsidePublicRoot(uploadRoot)) {
        return {
            details: { uploadRoot },
            message: "UPLOAD_ROOT must not be inside the public web root.",
            state: "error",
        };
    }

    try {
        await access(uploadRoot, constants.W_OK);

        return {
            details: {
                storeDebugArtifacts: isEnabled(input.STORE_DEBUG_ARTIFACTS),
                storeOriginalFiles: isEnabled(input.STORE_ORIGINAL_FILES),
                storePageImages: isEnabled(input.STORE_PAGE_IMAGES),
                uploadRoot,
            },
            message: "Upload root is writable.",
            state: "ok",
        };
    } catch {
        return {
            details: {
                storeDebugArtifacts: isEnabled(input.STORE_DEBUG_ARTIFACTS),
                storeOriginalFiles: isEnabled(input.STORE_ORIGINAL_FILES),
                storePageImages: isEnabled(input.STORE_PAGE_IMAGES),
                uploadRoot,
            },
            message: "Upload root is missing or not writable.",
            state: "degraded",
        };
    }
}

export function checkOpenRouterHealth(
    input: HealthInput = process.env
): HealthCheckResult {
    if (input.OPENROUTER_API_KEY && input.OPENROUTER_API_KEY.length > 0) {
        return {
            message: "OpenRouter key is configured.",
            state: "ok",
        };
    }

    return {
        message:
            "OpenRouter key is missing; LLM extraction and chat will show setup-required states.",
        state: "degraded",
    };
}

export function checkQueueHealth(
    input: HealthInput = process.env
): HealthCheckResult {
    const queue = getQueueProviderConfig(input);

    return {
        details: {
            provider: queue.provider,
            requestedProvider: input.QUEUE_PROVIDER ?? "db-fallback",
        },
        message:
            queue.reason ?? `Queue provider ${queue.provider} is configured.`,
        state: queue.reason ? "degraded" : "ok",
    };
}

export async function checkDatabaseHealth(
    input: HealthInput = process.env
): Promise<HealthCheckResult> {
    const database = getDatabaseProviderConfig(input);

    if (!database.connectionUrl) {
        return {
            details: { provider: database.provider },
            message: "Database connection URL is missing.",
            state: "error",
        };
    }

    const client = new Client({ connectionString: database.connectionUrl });

    try {
        await client.connect();
        await client.query("select 1");

        return {
            details: { provider: database.provider },
            message: "Database connection succeeded.",
            state: "ok",
        };
    } catch (error) {
        return {
            details: {
                error: error instanceof Error ? error.message : String(error),
                provider: database.provider,
            },
            message: "Database connection failed.",
            state: "error",
        };
    } finally {
        await client.end().catch(() => void 0);
    }
}

export async function checkVectorHealth(
    input: HealthInput = process.env
): Promise<HealthCheckResult> {
    const database = getDatabaseProviderConfig(input);

    if (!database.connectionUrl) {
        return {
            details: { provider: database.provider },
            message: "Cannot check pgvector without a database URL.",
            state: "degraded",
        };
    }

    const client = new Client({ connectionString: database.connectionUrl });

    try {
        await client.connect();
        const result = await client.query<{ installed: boolean }>(
            "select exists(select 1 from pg_extension where extname = 'vector') as installed"
        );
        const isInstalled = result.rows.at(0)?.installed === true;

        return {
            details: { provider: database.provider },
            message: isInstalled
                ? "pgvector extension is installed."
                : "pgvector extension is not installed.",
            state: isInstalled ? "ok" : "degraded",
        };
    } catch (error) {
        return {
            details: {
                error: error instanceof Error ? error.message : String(error),
                provider: database.provider,
            },
            message: "pgvector extension check failed.",
            state: "error",
        };
    } finally {
        await client.end().catch(() => void 0);
    }
}

export async function checkFullTextHealth(
    input: HealthInput = process.env
): Promise<HealthCheckResult> {
    const database = getDatabaseProviderConfig(input);

    if (!database.connectionUrl) {
        return {
            details: { provider: database.provider },
            message: "Cannot check full-text indexes without a database URL.",
            state: "degraded",
        };
    }

    const client = new Client({ connectionString: database.connectionUrl });

    try {
        await client.connect();
        const result = await client.query<{ found: number }>(
            "select count(*)::int as found from pg_indexes where indexname like '%fts%' or indexname like '%full_text%'"
        );
        const found = result.rows.at(0)?.found ?? 0;

        return {
            details: { found, provider: database.provider },
            message:
                found > 0
                    ? "Full-text indexes are present."
                    : "Full-text indexes have not been created yet.",
            state: found > 0 ? "ok" : "degraded",
        };
    } catch (error) {
        return {
            details: {
                error: error instanceof Error ? error.message : String(error),
                provider: database.provider,
            },
            message: "Full-text index check failed.",
            state: "error",
        };
    } finally {
        await client.end().catch(() => void 0);
    }
}

export async function getHealthReport(
    input: HealthInput = process.env
): Promise<HealthReport> {
    const [database, fullText, storage, vector] = await Promise.all([
        checkDatabaseHealth(input),
        checkFullTextHealth(input),
        checkUploadRootHealth(input),
        checkVectorHealth(input),
    ]);

    return {
        database,
        fullText,
        openRouter: checkOpenRouterHealth(input),
        queue: checkQueueHealth(input),
        storage,
        vector,
    };
}
