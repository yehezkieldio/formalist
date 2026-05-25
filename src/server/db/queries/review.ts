import { and, eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { extractedFacts, feeRules, tariffRows } from "#/server/db/schema";
import type { FactType, ReviewStatus } from "#/server/db/schema";

export interface ActiveTariffLookup {
    airline?: string;
    destinationCity?: string;
    destinationCode?: string;
}

export function searchActiveTariffRows(filters: ActiveTariffLookup) {
    const conditions = [eq(tariffRows.status, "active")];

    if (filters.airline) {
        conditions.push(eq(tariffRows.airline, filters.airline));
    }
    if (filters.destinationCity) {
        conditions.push(
            eq(tariffRows.destinationCity, filters.destinationCity)
        );
    }
    if (filters.destinationCode) {
        conditions.push(
            eq(tariffRows.destinationCode, filters.destinationCode)
        );
    }

    return getDatabase()
        .select()
        .from(tariffRows)
        .where(and(...conditions));
}

export function searchActiveFacts(factType?: FactType) {
    return getDatabase()
        .select()
        .from(extractedFacts)
        .where(
            factType
                ? and(
                      eq(extractedFacts.status, "active"),
                      eq(extractedFacts.factType, factType)
                  )
                : eq(extractedFacts.status, "active")
        );
}

export async function updateTariffRowReviewStatus(
    rowId: string,
    status: ReviewStatus
) {
    const [row] = await getDatabase()
        .update(tariffRows)
        .set({ status, updatedAt: new Date() })
        .where(eq(tariffRows.id, rowId))
        .returning();

    return row;
}

export async function updateFactReviewStatus(
    factId: string,
    status: ReviewStatus
) {
    const [fact] = await getDatabase()
        .update(extractedFacts)
        .set({ status, updatedAt: new Date() })
        .where(eq(extractedFacts.id, factId))
        .returning();

    return fact;
}

export async function updateFeeRuleReviewStatus(
    feeRuleId: string,
    status: ReviewStatus
) {
    const [rule] = await getDatabase()
        .update(feeRules)
        .set({ status, updatedAt: new Date() })
        .where(eq(feeRules.id, feeRuleId))
        .returning();

    return rule;
}
