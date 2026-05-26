import { ArrowRightIcon, FileTextIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";

import { AdminEmptyState, ReviewStatusBadge } from "./admin-primitives";

export function DocumentTable({
    deleteAction,
    documents,
}: {
    deleteAction: (formData: FormData) => Promise<void>;
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
            <div className="grid grid-cols-[minmax(18rem,1fr)_8rem_6.5rem_6.5rem_13rem] gap-3 border-b bg-muted/30 px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase max-xl:hidden">
                <span>Document</span>
                <span>Status</span>
                <span>Records</span>
                <span>Issues</span>
                <span>Actions</span>
            </div>
            <div className="divide-y">
                {documents.map((document) => (
                    <article
                        className="grid min-w-0 gap-3 p-3 transition-colors hover:bg-muted/20 xl:grid-cols-[minmax(18rem,1fr)_8rem_6.5rem_6.5rem_13rem] xl:items-center"
                        key={document.id}
                    >
                        <div className="min-w-0">
                            <Link
                                className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium text-sm hover:underline"
                                href={`/admin/documents/${document.id}`}
                                title={document.filename}
                            >
                                {document.filename}
                            </Link>
                            <div className="mt-1 grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                <p
                                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-xs"
                                    title={document.sourceName ?? undefined}
                                >
                                    {document.sourceName || "No source name"}
                                </p>
                                <p className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                                    updated{" "}
                                    {document.updatedAt.toLocaleDateString(
                                        "id-ID"
                                    )}
                                </p>
                            </div>
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
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_auto]">
                            <Button
                                asChild
                                className="w-full justify-between"
                                size="sm"
                                variant={
                                    document.issueCount > 0
                                        ? "default"
                                        : "outline"
                                }
                            >
                                <Link href={`/admin/documents/${document.id}`}>
                                    Open
                                    <ArrowRightIcon aria-hidden="true" />
                                </Link>
                            </Button>
                            <form action={deleteAction}>
                                <input
                                    name="documentId"
                                    type="hidden"
                                    value={document.id}
                                />
                                <Button
                                    aria-label={`Delete ${document.filename}`}
                                    className="w-full"
                                    size="sm"
                                    type="submit"
                                    variant="destructive"
                                >
                                    <Trash2Icon aria-hidden="true" />
                                    Delete
                                </Button>
                            </form>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
