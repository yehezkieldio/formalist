import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { AliasTable } from "#/components/admin/alias-table";
import { listAliases } from "#/server/retrieval/aliases";

export const dynamic = "force-dynamic";

export default async function AliasesPage() {
    const aliases = await listAliases();
    const ambiguous = aliases.filter((alias) => alias.isAmbiguous).length;
    const cityLike = aliases.filter(
        (alias) => alias.type === "city" || alias.type === "destination"
    ).length;
    const airline = aliases.filter((alias) => alias.type === "airline").length;

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                description="Manage city, airport, airline, route, and destination aliases used by retrieval, disambiguation, and direct tariff lookup."
                eyebrow="Normalization"
                title="Aliases"
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Aliases", value: aliases.length },
                    { label: "City/destination", value: cityLike },
                    { label: "Airline", value: airline },
                    {
                        label: "Ambiguous",
                        tone: ambiguous > 0 ? "warning" : "default",
                        value: ambiguous,
                    },
                ]}
            />
            <AliasTable aliases={aliases} />
        </div>
    );
}
