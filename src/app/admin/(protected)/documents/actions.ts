"use server";

import { revalidatePath } from "next/cache";

import { env } from "#/env";
import { writeReviewAuditLog } from "#/server/audit/audit-log";
import { requireAdmin } from "#/server/auth/require-admin";
import {
    deleteDocument,
    getDocumentStoragePaths,
} from "#/server/db/queries/documents";
import { forceCompleteAllDocumentReviews } from "#/server/db/queries/review";
import { deleteEmbeddingsForDocument } from "#/server/retrieval/embedding-jobs";
import { deleteDocumentStorageArtifacts } from "#/server/storage/local";

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

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

export async function deleteDocumentAction(formData: FormData) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        throw new Error("Admin authentication is required.");
    }

    const documentId = formData.get("documentId");

    if (typeof documentId !== "string" || !uuidPattern.test(documentId)) {
        throw new Error("Document id is required.");
    }

    const storagePaths = await getDocumentStoragePaths(documentId);

    await deleteEmbeddingsForDocument(documentId);
    const deletedDocument = await deleteDocument(documentId);

    if (!deletedDocument) {
        throw new Error("Document not found.");
    }

    if (storagePaths) {
        await deleteDocumentStorageArtifacts({
            documentId,
            originalPath: storagePaths.originalPath,
            pageImagePaths: storagePaths.pageImagePaths,
            uploadRoot: env.UPLOAD_ROOT,
        });
    }

    await writeReviewAuditLog({
        action: "documents.delete",
        before: {
            filename: deletedDocument.filename,
            id: deletedDocument.id,
            sourceName: deletedDocument.sourceName,
            status: deletedDocument.status,
        },
        entityId: deletedDocument.id,
        entityType: "document",
    });

    revalidatePath("/admin/documents");
    revalidatePath("/admin/review");
    revalidatePath("/admin/facts");
    revalidatePath("/admin/fee-rules");
    revalidatePath("/admin");
}
