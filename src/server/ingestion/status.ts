import { updateDocumentStatus } from "#/server/db/queries/documents";
import type { DocumentStatus } from "#/server/db/schema";
import type { QueueJob } from "#/server/queue/adapter";

const terminalStatuses = new Set<DocumentStatus>([
    "active",
    "archived",
    "failed",
    "rejected",
]);

export interface IngestionStatusUpdate {
    error?: string;
    job: QueueJob;
    status: DocumentStatus;
}

export function canMoveIngestionStatus(
    currentStatus: DocumentStatus,
    nextStatus: DocumentStatus
): boolean {
    if (currentStatus === nextStatus) {
        return true;
    }

    return !terminalStatuses.has(currentStatus);
}

export function setIngestionDocumentStatus(input: IngestionStatusUpdate) {
    return updateDocumentStatus(
        input.job.documentId,
        input.status,
        input.error
    );
}
