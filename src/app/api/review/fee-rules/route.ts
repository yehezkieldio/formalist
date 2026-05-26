import { NextResponse } from "next/server";

import { requireAdmin } from "#/server/auth/require-admin";
import { listFeeRulesForReview } from "#/server/db/queries/review";

export async function GET() {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    return NextResponse.json({ rules: await listFeeRulesForReview() });
}
