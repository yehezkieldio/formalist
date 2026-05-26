import { FileTextIcon } from "lucide-react";

import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { DocumentTable } from "#/components/admin/document-table";
import { DocumentUploadForm } from "#/components/admin/document-upload-form";
import { DocumentUploadStatus } from "#/components/admin/document-upload-status";
import { ForceCompleteAllDocumentsButton } from "#/components/admin/force-complete-all-documents-button";
import { Badge } from "#/components/ui/badge";
import { listDocumentsWithReviewSummary } from "#/server/db/queries/documents";

import { forceCompleteAllDocumentsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const documents = await listDocumentsWithReviewSummary();
    const failed = documents.filter(
        (document) => document.status === "failed"
    ).length;
    const active = documents.filter(
        (document) => document.status === "active"
    ).length;
    const reviewRecords = documents.reduce(
        (total, document) => total + document.reviewCount,
        0
    );
    const issues = documents.reduce(
        (total, document) => total + document.issueCount,
        0
    );

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                actions={
                    <>
                        <Badge variant="outline">
                            <FileTextIcon aria-hidden="true" />
                            {documents.length} files
                        </Badge>
                        <Badge variant={failed > 0 ? "destructive" : "outline"}>
                            {failed} failed
                        </Badge>
                        <ForceCompleteAllDocumentsButton
                            action={forceCompleteAllDocumentsAction}
                            disabled={documents.length === 0}
                            issueCount={issues}
                            recordCount={reviewRecords}
                        />
                    </>
                }
                description="Upload source pricelists, watch ingestion status, and jump into the extracted records behind each document."
                eyebrow="Ingestion"
                title="Documents"
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Documents", value: documents.length },
                    { label: "Active", tone: "success", value: active },
                    { label: "Review records", value: reviewRecords },
                    {
                        label: "Open issues",
                        tone: issues > 0 ? "warning" : "default",
                        value: issues,
                    },
                ]}
            />
            <section className="grid gap-4 border bg-muted/10 p-4">
                <DocumentUploadForm />
                <DocumentUploadStatus />
            </section>
            <DocumentTable documents={documents} />
        </div>
    );
}
