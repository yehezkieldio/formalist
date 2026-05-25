import { DocumentUploadForm } from "#/components/admin/document-upload-form";
import { DocumentUploadStatus } from "#/components/admin/document-upload-status";

export default function DocumentsPage() {
    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section>
                <h1 className="font-semibold text-2xl">Documents</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Upload source documents and track ingestion progress.
                </p>
            </section>
            <div className="grid gap-4">
                <DocumentUploadForm />
                <DocumentUploadStatus />
            </div>
        </div>
    );
}
