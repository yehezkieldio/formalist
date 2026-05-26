import { Badge } from "#/components/ui/badge";

export interface DocumentUploadStatusProps {
    error?: string;
    status?: "queued" | "parsing" | "failed" | "completed";
}

export function DocumentUploadStatus({
    error,
    status = "queued",
}: DocumentUploadStatusProps) {
    return (
        <div className="border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">Ingestion status</p>
                <Badge
                    variant={status === "failed" ? "destructive" : "secondary"}
                >
                    {status}
                </Badge>
            </div>
            {error ? (
                <p className="mt-2 border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
                    {error}
                </p>
            ) : (
                <p className="mt-2 text-muted-foreground text-xs leading-5">
                    The worker will update this document as parsing progresses.
                </p>
            )}
        </div>
    );
}
