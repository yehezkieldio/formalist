import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

import { getDatabaseProviderConfig } from "#/server/db/provider";

async function main() {
    const { connectionUrl } = getDatabaseProviderConfig();
    if (!connectionUrl) {
        throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
    }
    const client = new Client({ connectionString: connectionUrl });
    await client.connect();
    const db = drizzle({ client });

    process.stdout.write("Applying migrations...\n");
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    process.stdout.write("Migrations applied successfully!\n");

    await client.end();
}

try {
    await main();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Migration failed: ${message}\n`);
    process.exitCode = 1;
}
