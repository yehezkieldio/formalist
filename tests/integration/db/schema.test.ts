import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    aliases,
    answerVerifications,
    auditLogs,
    chatMessages,
    chatSessions,
    chatSources,
    chatToolCalls,
    documentChunks,
    documentPages,
    documents,
    embeddings,
    extractedFacts,
    extractionIssues,
    feeRules,
    ingestionJobs,
    settings,
    tableChunks,
    tariffRows,
} from "#/server/db/schema";

const expectedTables = [
    aliases,
    answerVerifications,
    auditLogs,
    chatMessages,
    chatSessions,
    chatSources,
    chatToolCalls,
    documentChunks,
    documentPages,
    documents,
    embeddings,
    extractedFacts,
    extractionIssues,
    feeRules,
    ingestionJobs,
    settings,
    tableChunks,
    tariffRows,
] as const;

function readMigration(filename: string) {
    return readFile(
        path.join(process.cwd(), "drizzle", "migrations", filename),
        "utf-8"
    );
}

describe("database schema", () => {
    it("exports every required table", () => {
        expect(expectedTables).toHaveLength(18);
    });

    it("enables vector and pgcrypto extensions before table creation", async () => {
        const migration = await readMigration(
            "0000_create_vector_extension.sql"
        );

        expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS pgcrypto");
        expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS vector");
    });

    it("creates all required first-version tables without seed tariff rows", async () => {
        const migration = await readMigration("0001_initial_schema.sql");

        for (const tableName of [
            "documents",
            "document_pages",
            "document_chunks",
            "table_chunks",
            "extracted_facts",
            "tariff_rows",
            "fee_rules",
            "aliases",
            "embeddings",
            "extraction_issues",
            "chat_sessions",
            "chat_messages",
            "chat_tool_calls",
            "chat_sources",
            "answer_verifications",
            "settings",
            "audit_logs",
            "ingestion_jobs",
        ]) {
            expect(migration).toContain(`CREATE TABLE "${tableName}"`);
        }

        expect(migration.toLowerCase()).not.toContain(
            "insert into tariff_rows"
        );
        expect(migration.toLowerCase()).not.toContain(
            "insert into extracted_facts"
        );
    });

    it("creates pgvector and full-text indexes", async () => {
        const vectorMigration = await readMigration(
            "0002_embedding_indexes.sql"
        );
        const fullTextMigration = await readMigration(
            "0003_full_text_indexes.sql"
        );

        expect(vectorMigration).toContain("USING hnsw");
        expect(vectorMigration).toContain("vector_cosine_ops");
        expect(vectorMigration).toContain('"owner_type", "owner_id"');
        expect(fullTextMigration).toContain("document_chunks_content_fts_idx");
        expect(fullTextMigration).toContain("table_chunks_text_fts_idx");
        expect(fullTextMigration).toContain("tariff_rows_text_fts_idx");
        expect(fullTextMigration).toContain("fee_rules_text_fts_idx");
    });
});
