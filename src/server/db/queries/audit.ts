import { desc } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { auditLogs } from "#/server/db/schema";

export interface AuditLogInput {
    action: string;
    actor: string;
    after?: unknown;
    before?: unknown;
    entityId?: string;
    entityType: string;
}

export async function writeAuditLog(input: AuditLogInput) {
    const [auditLog] = await getDatabase()
        .insert(auditLogs)
        .values(input)
        .returning();

    return auditLog;
}

export function listAuditLogs(limit = 100) {
    return getDatabase()
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
}
