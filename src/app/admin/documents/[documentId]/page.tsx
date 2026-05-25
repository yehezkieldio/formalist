import { notFound } from "next/navigation";

import { DocumentDetail } from "#/components/admin/document-detail";
import { getDocumentDetail } from "#/server/db/queries/documents";

export default async function DocumentDetailPage({
    params,
}: {
    params: Promise<{ documentId: string }>;
}) {
    const { documentId } = await params;
    const detail = await getDocumentDetail(documentId);

    if (!detail) {
        notFound();
    }

    return <DocumentDetail detail={detail} />;
}
