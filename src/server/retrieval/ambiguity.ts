import type { AliasType } from "#/server/db/schema";

import { resolveAlias } from "./aliases";

export interface ClarificationCandidate {
    canonicalValue: string;
    label: string;
    metadata: unknown;
    type: AliasType | "date" | "promo" | "route";
}

export async function detectAliasAmbiguity(input: {
    query: string;
    type: AliasType;
}): Promise<ClarificationCandidate[]> {
    const resolution = await resolveAlias(input);

    if (!resolution.isAmbiguous) {
        return [];
    }

    return resolution.candidates.map((candidate) => ({
        canonicalValue: candidate.canonicalValue,
        label: candidate.alias,
        metadata: candidate.metadata ?? null,
        type: candidate.type,
    }));
}

export function staticAmbiguityCandidates(input: {
    field: "date" | "promo" | "route";
    query: string;
}): ClarificationCandidate[] {
    if (input.field === "promo") {
        return [
            {
                canonicalValue: "promo",
                label: "Promo",
                metadata: null,
                type: "promo",
            },
            {
                canonicalValue: "regular",
                label: "Regular",
                metadata: null,
                type: "promo",
            },
        ];
    }

    if (input.field === "route") {
        return [
            {
                canonicalValue: "DIRECT",
                label: "Direct",
                metadata: null,
                type: "route",
            },
            {
                canonicalValue: "TRANSIT",
                label: "Transit",
                metadata: null,
                type: "route",
            },
        ];
    }

    return [
        {
            canonicalValue: "latest_active",
            label: "Latest active validity",
            metadata: { query: input.query },
            type: "date",
        },
        {
            canonicalValue: "specific_date",
            label: "Specific date",
            metadata: { query: input.query },
            type: "date",
        },
    ];
}
