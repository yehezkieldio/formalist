import { Badge } from "#/components/ui/badge";

import { SourceSnippetPreview } from "./source-snippet-preview";

export function FactReviewTable({
    facts,
}: {
    facts: {
        destinationCity: string | null;
        factType: string;
        id: string;
        rawEvidence: string | null;
        status: string;
        valueText: string | null;
    }[];
}) {
    return (
        <div className="grid gap-3">
            {facts.map((fact) => (
                <div key={fact.id} className="grid gap-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{fact.factType}</div>
                        <Badge variant="outline">{fact.status}</Badge>
                    </div>
                    <div className="text-muted-foreground text-sm">
                        {fact.destinationCity ?? "No destination"} ·{" "}
                        {fact.valueText ?? "No value"}
                    </div>
                    <SourceSnippetPreview
                        snippet={fact.rawEvidence}
                        sourceType="extracted_fact"
                    />
                </div>
            ))}
        </div>
    );
}
