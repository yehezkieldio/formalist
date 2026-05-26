import { z } from "zod";

export const deploymentModeSchema = z.enum([
    "docker-local",
    "managed-fallback",
    "self-hosted",
]);

export const databaseProviderSchema = z.enum(["postgres", "supabase"]);

export const queueProviderSchema = z.enum([
    "local-redis",
    "upstash-redis",
    "db-fallback",
]);

export type DeploymentMode = z.infer<typeof deploymentModeSchema>;
export type DatabaseProvider = z.infer<typeof databaseProviderSchema>;
export type QueueProvider = z.infer<typeof queueProviderSchema>;

export interface DeploymentConfig {
    databaseProvider: DatabaseProvider;
    deploymentMode: DeploymentMode;
    queueProvider: QueueProvider;
}

export interface DeploymentConfigInput {
    [key: string]: string | undefined;
    DATABASE_PROVIDER?: string;
    DEPLOYMENT_MODE?: string;
    QUEUE_PROVIDER?: string;
}

export function parseDeploymentMode(value: unknown): DeploymentMode {
    return deploymentModeSchema.parse(value ?? "docker-local");
}

export function parseDatabaseProvider(value: unknown): DatabaseProvider {
    return databaseProviderSchema.parse(value ?? "postgres");
}

export function parseQueueProvider(value: unknown): QueueProvider {
    return queueProviderSchema.parse(value ?? "db-fallback");
}

export function getDeploymentConfig(
    input: DeploymentConfigInput = process.env
): DeploymentConfig {
    return {
        databaseProvider: parseDatabaseProvider(input.DATABASE_PROVIDER),
        deploymentMode: parseDeploymentMode(input.DEPLOYMENT_MODE),
        queueProvider: parseQueueProvider(input.QUEUE_PROVIDER),
    };
}
