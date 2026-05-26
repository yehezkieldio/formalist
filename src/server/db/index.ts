import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getDatabaseProviderConfig } from "#/server/db/provider";
import * as relations from "#/server/db/relations";
import * as schema from "#/server/db/schema";

let pool: Pool | undefined;

export function getDatabase() {
    const { connectionUrl } = getDatabaseProviderConfig();

    if (!connectionUrl) {
        throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
    }

    pool ??= new Pool({ connectionString: connectionUrl });

    return drizzle({ client: pool, schema: { ...schema, ...relations } });
}

export type Database = ReturnType<typeof getDatabase>;
