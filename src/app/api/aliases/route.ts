import { NextResponse } from "next/server";

import { requireAdmin } from "#/server/auth/require-admin";
import { writeAuditLog } from "#/server/db/queries/audit";
import { createAliasRecord, listAliases } from "#/server/retrieval/aliases";

import { aliasRequestSchema } from "./schema";

export async function GET() {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    return NextResponse.json({ aliases: await listAliases() });
}

export async function POST(request: Request) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const input = aliasRequestSchema.parse(await request.json());
    const alias = await createAliasRecord(input);
    await writeAuditLog({
        action: "alias.create",
        actor: "admin",
        after: alias,
        entityId: alias?.id,
        entityType: "alias",
    });

    return NextResponse.json({ alias }, { status: 201 });
}
