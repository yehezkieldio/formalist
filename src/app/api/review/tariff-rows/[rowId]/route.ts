import { NextResponse } from "next/server";

import { tariffRowReviewSchema } from "#/app/api/review/schema";
import { writeReviewAuditLog } from "#/server/audit/audit-log";
import { requireAdmin } from "#/server/auth/require-admin";
import { updateTariffRow } from "#/server/db/queries/review";
import { assertNoBlockingIssues } from "#/server/ingestion/review/bulk-actions";

interface RowRouteContext {
    params: Promise<{ rowId: string }>;
}

export async function PUT(request: Request, context: RowRouteContext) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const { rowId } = await context.params;
    const input = tariffRowReviewSchema.parse(await request.json());

    if (input.status === "active") {
        await assertNoBlockingIssues({
            sourceIds: [rowId],
            sourceType: "tariff_row",
        });
    }

    const row = await updateTariffRow(rowId, input);
    await writeReviewAuditLog({
        action: "tariff_row.review",
        after: row,
        entityId: row?.id,
        entityType: "tariff_row",
    });

    return NextResponse.json({ row });
}
