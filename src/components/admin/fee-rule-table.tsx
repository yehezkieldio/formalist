import { Badge } from "#/components/ui/badge";

export function FeeRuleTable({
    rules,
}: {
    rules: {
        adminFeePerSmu: number | null;
        airline: string | null;
        id: string;
        minWeightKg: string | null;
        ppnPercent: string | null;
        status: string;
        warehouseFeePerKg: number | null;
    }[];
}) {
    return (
        <div className="grid gap-3">
            {rules.map((rule) => (
                <div key={rule.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div className="font-medium">
                            {rule.airline ?? "Document default fees"}
                        </div>
                        <Badge variant="outline">{rule.status}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-muted-foreground text-sm md:grid-cols-4">
                        <span>Admin {rule.adminFeePerSmu ?? "N/A"}</span>
                        <span>Warehouse {rule.warehouseFeePerKg ?? "N/A"}</span>
                        <span>Min {rule.minWeightKg ?? "N/A"} kg</span>
                        <span>PPN {rule.ppnPercent ?? "N/A"}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
