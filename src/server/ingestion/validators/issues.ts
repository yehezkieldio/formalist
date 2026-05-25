import { eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { extractionIssues } from "#/server/db/schema";

import type { ExtractionIssueDraft } from "./types";

export function toIssueInsertValues(issues: ExtractionIssueDraft[]) {
    return issues.map((issue) => ({
        ...issue,
        status: "open" as const,
    }));
}

export function deleteExtractionIssuesForDocument(documentId: string) {
    return getDatabase()
        .delete(extractionIssues)
        .where(eq(extractionIssues.documentId, documentId));
}

export function insertExtractionIssues(issues: ExtractionIssueDraft[]) {
    if (issues.length === 0) {
        return Promise.resolve([]);
    }

    return getDatabase()
        .insert(extractionIssues)
        .values(toIssueInsertValues(issues))
        .returning();
}
