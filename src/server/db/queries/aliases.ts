import { and, eq } from "drizzle-orm";

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

export function findAliasByTypeAndAlias(type: AliasType, alias: string) {
    return getDatabase()
        .select()
        .from(aliases)
        .where(and(eq(aliases.type, type), eq(aliases.alias, alias)));
}

export async function updateAlias(aliasId: string, input: Partial<AliasInput>) {
    const [alias] = await getDatabase()
        .update(aliases)
        .set({
            alias: input.alias,
            canonicalValue: input.canonicalValue,
            isAmbiguous: input.isAmbiguous,
            metadata: input.metadata,
            type: input.type,
            updatedAt: new Date(),
        })
        .where(eq(aliases.id, aliasId))
        .returning();

    return alias;
}

export async function deleteAlias(aliasId: string) {
    const [deletedAlias] = await getDatabase()
        .delete(aliases)
        .where(eq(aliases.id, aliasId))
        .returning();

    return deletedAlias;
}
