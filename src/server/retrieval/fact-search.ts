import { and, eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { extractedFacts } from "#/server/db/schema";
import type { FactType, ReviewStatus } from "#/server/db/schema";

export function searchFacts(input: {
    airline?: string;
    destinationCode?: string;
    destinationCity?: string;
    factType?: FactType;
    status?: ReviewStatus;
}) {
    const conditions = [];

    if (input.factType) {
        conditions.push(eq(extractedFacts.factType, input.factType));
    }
    if (input.airline) {
        conditions.push(eq(extractedFacts.airline, input.airline));
    }
    if (input.destinationCity) {
        conditions.push(
            eq(extractedFacts.destinationCity, input.destinationCity)
        );
    }
    if (input.destinationCode) {
        conditions.push(
            eq(extractedFacts.destinationCode, input.destinationCode)
        );
    }
    if (input.status) {
        conditions.push(eq(extractedFacts.status, input.status));
    }

    return getDatabase()
        .select()
        .from(extractedFacts)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
}
