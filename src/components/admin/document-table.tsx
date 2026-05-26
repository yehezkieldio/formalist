import { ArrowRightIcon, FileTextIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";

import { AdminEmptyState, ReviewStatusBadge } from "./admin-primitives";

export function DocumentTable({
    documents,
}: {
    documents: {
        filename: string;
        id: string;
        ingestionError: string | null;
        issueCount: number;
        reviewCount: number;
        sourceName: string | null;
        status: string;
        updatedAt: Date;
    }[];
}) {
    if (documents.length === 0) {
        return (
            <AdminEmptyState
                description="Upload PDF, DOCX, or TXT pricelist documents to start building searchable tariff memory."
                icon={FileTextIcon}
                title="No documents uploaded"
            />
        );
    }

    return (
        <section className="overflow-hidden border">
            <div className="grid grid-cols-[minmax(0,1fr)_9rem_7rem_7rem_6rem] border-b bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase max-lg:hidden">
                <span>Document</span>
                <span>Status</span>
                <span>Records</span>
                <span>Issues</span>
                <span />
            </div>
            <div className="divide-y">
                {documents.map((document) => (
                    <article
                        className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_9rem_7rem_7rem_6rem] lg:items-center"
                        key={document.id}
                    >
                        <div className="min-w-0">
                            <Link
                                className="truncate font-medium text-sm hover:underline"
                                href={`/admin/documents/${document.id}`}
                            >
                                {document.filename}
                            </Link>
                            <p className="mt-1 truncate text-muted-foreground text-xs">
                                {document.sourceName || "No source name"} ·{" "}
                                updated{" "}
                                {document.updatedAt.toLocaleDateString("id-ID")}
                            </p>
                            {document.ingestionError ? (
                                <p className="mt-2 line-clamp-2 border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
                                    {document.ingestionError}
                                </p>
                            ) : null}
                        </div>
                        <ReviewStatusBadge status={document.status} />
                        <Badge variant="outline">
                            {document.reviewCount} records
                        </Badge>
                        <Badge
                            variant={
                                document.issueCount > 0
                                    ? "destructive"
                                    : "outline"
                            }
                        >
                            {document.issueCount} issues
                        </Badge>
                        <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/documents/${document.id}`}>
                                Open
                                <ArrowRightIcon aria-hidden="true" />
                            </Link>
                        </Button>
                    </article>
                ))}
            </div>
        </section>
    );
}
