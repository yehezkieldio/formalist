import { distance } from "fastest-levenshtein";
import Fuse from "fuse.js";

import {
    createAlias,
    deleteAlias,
    findAliasByTypeAndAlias,
    findAliasesByType,
    listAliases,
    updateAlias,
} from "#/server/db/queries/aliases";
import type { AliasInput } from "#/server/db/queries/aliases";
import type { AliasType } from "#/server/db/schema";

export interface AliasRecord extends AliasInput {
    id?: string;
}

export interface AliasResolution {
    candidates: AliasRecord[];
    confidence: number;
    isAmbiguous: boolean;
    query: string;
    resolved: AliasRecord | null;
}

function normalizeAlias(value: string) {
    return value.trim().toLowerCase();
}

export function resolveAliasFromRecords(input: {
    query: string;
    records: AliasRecord[];
}): AliasResolution {
    const normalizedQuery = normalizeAlias(input.query);
    const exactMatches = input.records.filter(
        (record) => normalizeAlias(record.alias) === normalizedQuery
    );

    if (exactMatches.length > 0) {
        return {
            candidates: exactMatches,
            confidence: 1,
            isAmbiguous:
                exactMatches.length > 1 ||
                exactMatches.some((record) => record.isAmbiguous),
            query: input.query,
            resolved: exactMatches.length === 1 ? exactMatches[0] : null,
        };
    }

    const fuse = new Fuse(input.records, {
        includeScore: true,
        keys: ["alias", "canonicalValue"],
        threshold: 0.38,
    });
    const candidates = fuse
        .search(input.query)
        .toSorted((left, right) => {
            const scoreDelta = (left.score ?? 1) - (right.score ?? 1);

            if (scoreDelta !== 0) {
                return scoreDelta;
            }

            return (
                distance(normalizedQuery, normalizeAlias(left.item.alias)) -
                distance(normalizedQuery, normalizeAlias(right.item.alias))
            );
        })
        .slice(0, 5)
        .map((result) => result.item);

    const [resolved] = candidates;

    return {
        candidates,
        confidence: resolved
            ? Math.max(
                  0,
                  1 -
                      distance(
                          normalizedQuery,
                          normalizeAlias(resolved.alias)
                      ) /
                          10
              )
            : 0,
        isAmbiguous:
            candidates.length > 1 ||
            Boolean(resolved?.isAmbiguous) ||
            candidates.some((candidate) => candidate.isAmbiguous),
        query: input.query,
        resolved: resolved ?? null,
    };
}

export async function resolveAlias(input: {
    query: string;
    type: AliasType;
}): Promise<AliasResolution> {
    const records = await findAliasesByType(input.type);

    return resolveAliasFromRecords({ query: input.query, records });
}

export async function createAliasRecord(input: AliasInput) {
    const existing = await findAliasByTypeAndAlias(input.type, input.alias);

    if (existing.length > 0) {
        throw new Error("Alias already exists for this type.");
    }

    return createAlias(input);
}

export {
    deleteAlias as deleteAliasRecord,
    findAliasesByType,
    listAliases,
    updateAlias as updateAliasRecord,
};
