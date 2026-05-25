import { DetailRows } from "#/components/ai/source-detail-rows";

export function FeeRuleDetailCard({
    source,
}: {
    source: Record<string, unknown>;
}) {
    return (
        <DetailRows
            rows={[
                ["Airline", source.airline],
                ["Admin fee / SMU", source.adminFeePerSmu],
                ["Warehouse fee / kg", source.warehouseFeePerKg],
                ["Warehouse admin / SMU", source.warehouseAdminPerSmu],
                ["Minimum weight", source.minWeightKg],
                ["PPN percent", source.ppnPercent],
                ["DG surcharge", source.dgSurcharge],
                ["Notes", source.notes],
            ]}
            title="Fee rule"
        />
    );
}
