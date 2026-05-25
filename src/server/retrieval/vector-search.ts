import { sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import type { EmbeddingOwnerType } from "#/server/db/schema";

export interface VectorSearchResult {
    ownerId: string;
    ownerType: EmbeddingOwnerType;
    score: number;
    searchableText: string;
}

export function vectorToSqlLiteral(vector: number[]) {
    return `[${vector.join(",")}]`;
}

export async function vectorSearch(input: {
    embedding: number[];
    limit?: number;
    ownerTypes?: EmbeddingOwnerType[];
}): Promise<VectorSearchResult[]> {
    const limit = input.limit ?? 10;
    const vectorLiteral = vectorToSqlLiteral(input.embedding);
    const ownerTypeFilter =
        input.ownerTypes && input.ownerTypes.length > 0
            ? sql`and owner_type = any(${input.ownerTypes})`
            : sql``;
    const result = await getDatabase().execute(sql`
        select
            owner_id as "ownerId",
            owner_type as "ownerType",
            searchable_text as "searchableText",
            1 - (embedding <=> ${vectorLiteral}::vector) as score
        from embeddings
        where embedding is not null
        ${ownerTypeFilter}
        order by embedding <=> ${vectorLiteral}::vector
        limit ${limit}
    `);

    return result as unknown as VectorSearchResult[];
}
