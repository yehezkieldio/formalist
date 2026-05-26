import { DetailRows } from "#/components/ai/source-detail-rows";

function formatRange(from: unknown, until: unknown) {
    if (!from && !until) {
        return null;
    }

    return `${String(from ?? "unknown")} - ${String(until ?? "unknown")}`;
}

export function FactDetailCard({
    source,
}: {
    source: Record<string, unknown>;
}) {
    return (
        <DetailRows
            rows={[
                ["Fact type", source.factType],
                ["Airline", source.airline],
                ["Destination", source.destinationCity],
                ["Code", source.destinationCode],
                ["Value", source.valueText ?? source.valueNumber],
                ["Validity", formatRange(source.validFrom, source.validUntil)],
                ["Evidence", source.rawEvidence],
            ]}
            title="Extracted fact"
        />
    );
}
