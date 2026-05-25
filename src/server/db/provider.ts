import { getDeploymentConfig } from "#/server/deployment/mode";
import type { DatabaseProvider } from "#/server/deployment/mode";

export interface DatabaseProviderInput {
    [key: string]: string | undefined;
    DATABASE_PROVIDER?: string;
    DATABASE_URL?: string;
    SUPABASE_DATABASE_URL?: string;
}

export interface DatabaseProviderConfig {
    connectionUrl?: string;
    provider: DatabaseProvider;
}

function emptyToUndefined(value: string | undefined): string | undefined {
    return value && value.trim().length > 0 ? value : undefined;
}

export function getDatabaseProviderConfig(
    input: DatabaseProviderInput = process.env
): DatabaseProviderConfig {
    const { databaseProvider } = getDeploymentConfig(input);
    const databaseUrl = emptyToUndefined(input.DATABASE_URL);
    const supabaseDatabaseUrl = emptyToUndefined(input.SUPABASE_DATABASE_URL);

    if (databaseProvider === "supabase") {
        return {
            connectionUrl: supabaseDatabaseUrl ?? databaseUrl,
            provider: databaseProvider,
        };
    }

    return {
        connectionUrl: databaseUrl,
        provider: databaseProvider,
    };
}
