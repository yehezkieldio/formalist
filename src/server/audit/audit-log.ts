import { writeAuditLog } from "#/server/db/queries/audit";

export function writeReviewAuditLog(input: {
    action: string;
    after?: unknown;
    before?: unknown;
    entityId?: string;
    entityType: string;
}) {
    return writeAuditLog({
        ...input,
        actor: "admin",
    });
}
