import { and, eq, isNull, or } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { feeRules } from "#/server/db/schema";

export async function findApplicableFeeRule(input: {
    airline?: string | null;
    documentId?: string | null;
}) {
    const conditions = [];

    if (input.documentId) {
        conditions.push(eq(feeRules.documentId, input.documentId));
    }
    if (input.airline) {
        const airlineCondition = or(
            eq(feeRules.airline, input.airline),
            isNull(feeRules.airline)
        );

        if (airlineCondition) {
            conditions.push(airlineCondition);
        }
    }

    const rules = await getDatabase()
        .select()
        .from(feeRules)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    const [rule] = rules;

    return {
        rule: rule ?? null,
        warnings: rule ? [] : ["No fee rule found."],
    };
}
