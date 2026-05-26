import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { extractedFacts, feeRules, tariffRows } from "#/server/db/schema";

export type InsertExtractedFactInput = typeof extractedFacts.$inferInsert;
export type InsertTariffRowInput = typeof tariffRows.$inferInsert;
export type InsertFeeRuleInput = typeof feeRules.$inferInsert;

export function insertExtractedFacts(records: InsertExtractedFactInput[]) {
    if (records.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase().insert(extractedFacts).values(records).returning();
}

export function insertTariffRows(records: InsertTariffRowInput[]) {
    if (records.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase().insert(tariffRows).values(records).returning();
}

export function insertFeeRules(records: InsertFeeRuleInput[]) {
    if (records.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase().insert(feeRules).values(records).returning();
}

export async function listExtractedRecordsForValidation(documentId: string) {
    const [facts, rows, rules] = await Promise.all([
        getDatabase()
            .select()
            .from(extractedFacts)
            .where(eq(extractedFacts.documentId, documentId)),
        getDatabase()
            .select()
            .from(tariffRows)
            .where(eq(tariffRows.documentId, documentId)),
        getDatabase()
            .select()
            .from(feeRules)
            .where(eq(feeRules.documentId, documentId)),
    ]);

    return {
        facts,
        feeRules: rules,
        tariffRows: rows,
    };
}
