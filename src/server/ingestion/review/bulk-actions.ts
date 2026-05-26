import { and, eq } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { extractionIssues } from "#/server/db/schema";
import type { IssueSeverity, IssueStatus } from "#/server/db/schema";

interface BlockingIssueRecord {
    severity: IssueSeverity;
    sourceId: string | null;
    sourceType: string | null;
    status: IssueStatus;
}

export function assertNoBlockingIssueRecords(
    records: BlockingIssueRecord[],
    input: {
        sourceIds: string[];
        sourceType: string;
    }
) {
    const blockingIssue = records.find(
        (record) =>
            record.sourceType === input.sourceType &&
            record.sourceId &&
            input.sourceIds.includes(record.sourceId) &&
            record.severity === "high" &&
            record.status === "open"
    );

    if (blockingIssue?.sourceId) {
        throw new Error(
            `Cannot approve ${blockingIssue.sourceId}; unresolved high severity issues remain.`
        );
    }
}

export async function assertNoBlockingIssues(input: {
    sourceIds: string[];
    sourceType: string;
}) {
    for (const sourceId of input.sourceIds) {
        const blockingIssues = await getDatabase()
            .select()
            .from(extractionIssues)
            .where(
                and(
                    eq(extractionIssues.sourceType, input.sourceType),
                    eq(extractionIssues.sourceId, sourceId),
                    eq(extractionIssues.severity, "high"),
                    eq(extractionIssues.status, "open")
                )
            );

        assertNoBlockingIssueRecords(blockingIssues, {
            sourceIds: [sourceId],
            sourceType: input.sourceType,
        });
    }
}
