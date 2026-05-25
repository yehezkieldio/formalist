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
