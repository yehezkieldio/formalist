import { DocumentTable } from "#/components/admin/document-table";
import { DocumentUploadForm } from "#/components/admin/document-upload-form";
import { DocumentUploadStatus } from "#/components/admin/document-upload-status";
import { listDocumentsWithReviewSummary } from "#/server/db/queries/documents";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const documents = await listDocumentsWithReviewSummary();

    return (
        <div className="grid gap-6">
            <section>
                <h1 className="font-semibold text-2xl">Documents</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Upload source documents and track ingestion progress.
                </p>
            </section>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <DocumentTable documents={documents} />
                <div className="grid gap-4">
                    <DocumentUploadForm />
                    <DocumentUploadStatus />
                </div>
            </div>
        </div>
    );
}
