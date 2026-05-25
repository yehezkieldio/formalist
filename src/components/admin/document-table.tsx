import Link from "next/link";

import { Badge } from "#/components/ui/badge";

export function DocumentTable({
    documents,
}: {
    documents: {
        filename: string;
        id: string;
        issueCount: number;
        reviewCount: number;
        sourceName: string | null;
        status: string;
        updatedAt: Date;
    }[];
}) {
    return (
        <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                    <tr>
                        <th className="p-3">Document</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Review</th>
                        <th className="p-3">Issues</th>
                        <th className="p-3">Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((document) => (
                        <tr key={document.id} className="border-t">
                            <td className="p-3">
                                <Link
                                    className="font-medium hover:underline"
                                    href={`/admin/documents/${document.id}`}
                                >
                                    {document.filename}
                                </Link>
                                <div className="text-muted-foreground">
                                    {document.sourceName || "No source name"}
                                </div>
                            </td>
                            <td className="p-3">
                                <Badge variant="outline">
                                    {document.status}
                                </Badge>
                            </td>
                            <td className="p-3">{document.reviewCount}</td>
                            <td className="p-3">{document.issueCount}</td>
                            <td className="p-3">
                                {document.updatedAt.toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
