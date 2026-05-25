import { sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";

import type { RetrievalSource } from "./types";

export const localIndexEvaluation = {
    flexsearch:
        "Useful for small local/admin-side browser indexes, but not a replacement for Postgres FTS persistence.",
    minisearch:
        "Useful for lightweight client-side filtering; keep trusted retrieval on Postgres FTS plus pgvector.",
};

export async function fullTextSearch(input: {
    limit?: number;
    query: string;
}): Promise<RetrievalSource[]> {
    const limit = input.limit ?? 10;
    const result = await getDatabase().execute(sql`
        select owner_id as "ownerId", owner_type as "ownerType", searchable_text as snippet, 1 as score
        from embeddings
        where to_tsvector('simple', searchable_text) @@ plainto_tsquery('simple', ${input.query})
        limit ${limit}
    `);

    return result as unknown as RetrievalSource[];
}
