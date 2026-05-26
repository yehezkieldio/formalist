import { NextResponse } from "next/server";

import { factReviewSchema } from "#/app/api/review/schema";
import { writeReviewAuditLog } from "#/server/audit/audit-log";
import { requireAdmin } from "#/server/auth/require-admin";
import { updateExtractedFact } from "#/server/db/queries/review";
import { assertNoBlockingIssues } from "#/server/ingestion/review/bulk-actions";

interface FactRouteContext {
    params: Promise<{ factId: string }>;
}

export async function PUT(request: Request, context: FactRouteContext) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const { factId } = await context.params;
    const input = factReviewSchema.parse(await request.json());

    if (input.status === "active") {
        await assertNoBlockingIssues({
            sourceIds: [factId],
            sourceType: "extracted_fact",
        });
    }

    const fact = await updateExtractedFact(factId, input);
    await writeReviewAuditLog({
        action: "fact.review",
        after: fact,
        entityId: fact?.id,
        entityType: "extracted_fact",
    });

    return NextResponse.json({ fact });
}
