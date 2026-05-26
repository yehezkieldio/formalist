import { NextResponse } from "next/server";

import { feeRuleReviewSchema } from "#/app/api/review/schema";
import { writeReviewAuditLog } from "#/server/audit/audit-log";
import { requireAdmin } from "#/server/auth/require-admin";
import { updateFeeRule } from "#/server/db/queries/review";
import { assertNoBlockingIssues } from "#/server/ingestion/review/bulk-actions";

interface RuleRouteContext {
    params: Promise<{ ruleId: string }>;
}

export async function PUT(request: Request, context: RuleRouteContext) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const { ruleId } = await context.params;
    const input = feeRuleReviewSchema.parse(await request.json());

    if (input.status === "active") {
        await assertNoBlockingIssues({
            sourceIds: [ruleId],
            sourceType: "fee_rule",
        });
    }

    const rule = await updateFeeRule(ruleId, input);
    await writeReviewAuditLog({
        action: "fee_rule.review",
        after: rule,
        entityId: rule?.id,
        entityType: "fee_rule",
    });

    return NextResponse.json({ rule });
}
