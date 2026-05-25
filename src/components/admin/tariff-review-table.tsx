import { Badge } from "#/components/ui/badge";

import { SourceSnippetPreview } from "./source-snippet-preview";

export function TariffReviewTable({
    rows,
}: {
    rows: {
        airline: string | null;
        destinationCity: string | null;
        destinationCode: string | null;
        id: string;
        rawRowText: string | null;
        smuPricePerKg: number | null;
        status: string;
    }[];
}) {
    return (
        <div className="grid gap-3">
            {rows.map((row) => (
                <div key={row.id} className="grid gap-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                            {row.airline ?? "Unknown airline"} ·{" "}
                            {row.destinationCity ?? "Unknown"}{" "}
                            {row.destinationCode ?? ""}
                        </div>
                        <Badge variant="outline">{row.status}</Badge>
                    </div>
                    <div className="text-sm">
                        SMU {row.smuPricePerKg ?? "N/A"}
                    </div>
                    <SourceSnippetPreview
                        snippet={row.rawRowText}
                        sourceType="tariff_row"
                    />
                </div>
            ))}
        </div>
    );
}
