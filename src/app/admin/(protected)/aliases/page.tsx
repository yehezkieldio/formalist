import { AliasTable } from "#/components/admin/alias-table";
import { listAliases } from "#/server/retrieval/aliases";

export const dynamic = "force-dynamic";

export default async function AliasesPage() {
    const aliases = await listAliases();

    return (
        <div className="grid gap-6">
            <section>
                <h1 className="font-semibold text-2xl">Aliases</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Manage city, airport, airline, route, and destination
                    aliases used by retrieval and ambiguity checks.
                </p>
            </section>
            <AliasTable aliases={aliases} />
        </div>
    );
}
