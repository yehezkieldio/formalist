import { and, eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { tableChunks } from "#/server/db/schema";
import type { ReviewStatus } from "#/server/db/schema";

import type { RetrievalSource } from "./types";

export async function searchTableChunks(input: {
    documentId?: string;
    limit?: number;
    query: string;
    status?: ReviewStatus;
}): Promise<RetrievalSource[]> {
    const conditions = [];

    if (input.documentId) {
        conditions.push(eq(tableChunks.documentId, input.documentId));
    }
    if (input.status) {
        conditions.push(eq(tableChunks.status, input.status));
    }

    const rows =
        conditions.length > 0
            ? await getDatabase()
                  .select()
                  .from(tableChunks)
                  .where(and(...conditions))
            : await getDatabase().select().from(tableChunks);

    return rows
        .filter((row) =>
            `${row.headerText ?? ""} ${row.rowText}`
                .toLowerCase()
                .includes(input.query.toLowerCase())
        )
        .slice(0, input.limit ?? 10)
        .map((row, index) => ({
            documentId: row.documentId,
            ownerId: row.id,
            ownerType: "table_chunk",
            pageNumber: row.pageNumber,
            score: 1 / (index + 1),
            snippet: row.rowText,
            title: `Table ${row.tableIndex ?? "?"} row ${row.rowIndex ?? "?"}`,
        }));
}
