import type { IssueSeverity } from "#/server/db/schema";

export interface ExtractionIssueDraft {
    documentId: string;
    issueType: string;
    message: string;
    severity: IssueSeverity;
    sourceId?: string | null;
    sourceType?: string | null;
}
