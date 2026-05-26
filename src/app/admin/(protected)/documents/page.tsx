import { FileTextIcon, UploadIcon } from "lucide-react";

import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { DocumentTable } from "#/components/admin/document-table";
import { DocumentUploadForm } from "#/components/admin/document-upload-form";
import { DocumentUploadStatus } from "#/components/admin/document-upload-status";
import { Badge } from "#/components/ui/badge";
import { listDocumentsWithReviewSummary } from "#/server/db/queries/documents";

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
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <DocumentTable documents={documents} />
                <div className="grid gap-4">
                    <div className="border bg-muted/10 p-4">
                        <div className="flex items-center gap-2">
                            <UploadIcon aria-hidden="true" className="size-4" />
                            <h2 className="font-semibold text-sm">
                                Add document
                            </h2>
                        </div>
                        <p className="mt-2 text-muted-foreground text-xs leading-5">
                            Files are queued for parsing, chunking, extraction,
                            and activation. Store originals only when the
                            deployment storage is configured.
                        </p>
                    </div>
                    <DocumentUploadForm />
                    <DocumentUploadStatus />
                </div>
            </div>
        </div>
    );
}
