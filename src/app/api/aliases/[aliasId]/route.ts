import { NextResponse } from "next/server";

import { aliasRequestSchema } from "#/app/api/aliases/schema";
import { requireAdmin } from "#/server/auth/require-admin";
import { writeAuditLog } from "#/server/db/queries/audit";
import {
    deleteAliasRecord,
    updateAliasRecord,
} from "#/server/retrieval/aliases";

interface AliasRouteContext {
    params: Promise<{
        aliasId: string;
    }>;
}

export async function PUT(request: Request, context: AliasRouteContext) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const { aliasId } = await context.params;
    const input = aliasRequestSchema.parse(await request.json());
    const alias = await updateAliasRecord(aliasId, input);
    await writeAuditLog({
        action: "alias.update",
        actor: "admin",
        after: alias,
        entityId: alias?.id,
        entityType: "alias",
    });

    return NextResponse.json({ alias });
}

export async function DELETE(_request: Request, context: AliasRouteContext) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const { aliasId } = await context.params;
    const alias = await deleteAliasRecord(aliasId);
    await writeAuditLog({
        action: "alias.delete",
        actor: "admin",
        before: alias,
        entityId: alias?.id,
        entityType: "alias",
    });

    return NextResponse.json({ alias });
}
