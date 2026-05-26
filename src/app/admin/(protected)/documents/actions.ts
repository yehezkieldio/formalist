"use server";

import { revalidatePath } from "next/cache";

import { writeReviewAuditLog } from "#/server/audit/audit-log";
import { requireAdmin } from "#/server/auth/require-admin";
import { forceCompleteAllDocumentReviews } from "#/server/db/queries/review";

export async function forceCompleteAllDocumentsAction() {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        throw new Error("Admin authentication is required.");
    }

    const summary = await forceCompleteAllDocumentReviews();

    await writeReviewAuditLog({
        action: "documents.force_complete_all",
        after: summary,
        entityType: "documents",
    });

    revalidatePath("/admin/documents");
    revalidatePath("/admin/review");
    revalidatePath("/admin");
}
