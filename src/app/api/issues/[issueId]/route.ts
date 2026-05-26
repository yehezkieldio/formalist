import { NextResponse } from "next/server";
import * as z from "zod";

import { requireAdmin } from "#/server/auth/require-admin";
import { updateExtractionIssueStatus } from "#/server/db/queries/documents";
import { issueStatuses } from "#/server/db/schema";

const issueStatusSchema = z.object({
    status: z.enum(issueStatuses),
});

interface IssueRouteContext {
    params: Promise<{ issueId: string }>;
}

export async function PATCH(request: Request, context: IssueRouteContext) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const { issueId } = await context.params;
    const input = issueStatusSchema.parse(await request.json());
    const issue = await updateExtractionIssueStatus(issueId, input.status);

    return NextResponse.json({ issue });
}
