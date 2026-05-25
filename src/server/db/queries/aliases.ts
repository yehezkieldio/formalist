import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { aliases } from "#/server/db/schema";
import type { AliasType } from "#/server/db/schema";

export interface AliasInput {
    alias: string;
    canonicalValue: string;
    isAmbiguous?: boolean;
    metadata?: unknown;
    type: AliasType;
}

export async function createAlias(input: AliasInput) {
    const [alias] = await getDatabase()
        .insert(aliases)
        .values({
            alias: input.alias,
            canonicalValue: input.canonicalValue,
            isAmbiguous: input.isAmbiguous ?? false,
            metadata: input.metadata,
            type: input.type,
        })
        .returning();

    return alias;
}

export function listAliases() {
    return getDatabase().select().from(aliases);
}

export function findAliasesByType(type: AliasType) {
    return getDatabase().select().from(aliases).where(eq(aliases.type, type));
}

export async function deleteAlias(aliasId: string) {
    const [deletedAlias] = await getDatabase()
        .delete(aliases)
        .where(eq(aliases.id, aliasId))
        .returning();

    return deletedAlias;
}
