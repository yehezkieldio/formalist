import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { describe } from "vitest";

import { getDatabase } from "#/server/db";

const TABLES = [
    "answer_verifications",
    "chat_sources",
    "chat_tool_calls",
    "chat_messages",
    "chat_sessions",
    "extraction_issues",
    "embeddings",
    "aliases",
    "fee_rules",
    "tariff_rows",
    "extracted_facts",
    "table_chunks",
    "document_chunks",
    "document_pages",
    "ingestion_jobs",
    "audit_logs",
    "settings",
    "documents",
] as const;

export function hasIntegrationDatabase() {
    return Boolean(
        process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL
    );
}

export const describeWithDatabase = hasIntegrationDatabase()
    ? describe
    : describe.skip;

export async function runIntegrationMigrations() {
    const db = getDatabase();
    await migrate(db, { migrationsFolder: "drizzle/migrations" });
}

export async function cleanIntegrationDatabase() {
    const db = getDatabase();

    for (const tableName of TABLES) {
        await db.execute(
            sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`)
        );
    }
}
