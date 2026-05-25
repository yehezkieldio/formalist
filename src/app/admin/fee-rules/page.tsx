import { FeeRuleTable } from "#/components/admin/fee-rule-table";
import { listFeeRulesForReview } from "#/server/db/queries/review";

export default async function FeeRulesPage() {
    const rules = await listFeeRulesForReview();

    return (
        <div className="grid gap-6">
            <section>
                <h1 className="font-semibold text-2xl">Fee Rules</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Review admin fees, warehouse fees, minimum weight, PPN, and
                    surcharge notes.
                </p>
            </section>
            <FeeRuleTable rules={rules} />
        </div>
    );
}
