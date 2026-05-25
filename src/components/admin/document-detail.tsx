import { Badge } from "#/components/ui/badge";

export function DocumentDetail({
    detail,
}: {
    detail: {
        chunks: unknown[];
        document: {
            effectiveDate: string | null;
            filename: string;
            ingestionError: string | null;
            status: string;
            storeOriginalFile: boolean;
            storePageImages: boolean;
            validFrom: string | null;
            validUntil: string | null;
        };
        facts: unknown[];
        feeRules: unknown[];
        issues: unknown[];
        tableChunks: unknown[];
        tariffRows: unknown[];
    };
}) {
    const { document } = detail;

    return (
        <div className="grid gap-4">
            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
                <div>
                    <h1 className="font-semibold text-2xl">
                        {document.filename}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{document.status}</Badge>
                        {document.storeOriginalFile ? (
                            <Badge variant="secondary">Original stored</Badge>
                        ) : null}
                        {document.storePageImages ? (
                            <Badge variant="secondary">Pages stored</Badge>
                        ) : null}
                    </div>
                </div>
                <div className="text-sm">
                    <div>Effective: {document.effectiveDate ?? "Unknown"}</div>
                    <div>
                        Valid: {document.validFrom ?? "Unknown"} to{" "}
                        {document.validUntil ?? "Unknown"}
                    </div>
                </div>
                <div className="text-sm">
                    <div>Chunks: {detail.chunks.length}</div>
                    <div>Table chunks: {detail.tableChunks.length}</div>
                    <div>Facts: {detail.facts.length}</div>
                    <div>Tariff rows: {detail.tariffRows.length}</div>
                    <div>Fee rules: {detail.feeRules.length}</div>
                    <div>Issues: {detail.issues.length}</div>
                </div>
            </div>
            {document.ingestionError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
                    {document.ingestionError}
                </div>
            ) : null}
        </div>
    );
}
