import { Badge } from "#/components/ui/badge";

export function SourceSnippetPreview({
    documentId,
    pageNumber,
    snippet,
    sourceType,
}: {
    documentId?: string | null;
    pageNumber?: number | null;
    snippet?: string | null;
    sourceType: string;
}) {
    return (
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{sourceType}</Badge>
                {pageNumber ? (
                    <Badge variant="secondary">Page {pageNumber}</Badge>
                ) : null}
                {documentId ? (
                    <span className="text-muted-foreground">
                        Document {documentId.slice(0, 8)}
                    </span>
                ) : null}
            </div>
            <p className="line-clamp-3 text-muted-foreground">
                {snippet || "No source snippet available."}
            </p>
        </div>
    );
}
