import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { FeeRuleTable } from "#/components/admin/fee-rule-table";
import { listFeeRulesForReview } from "#/server/db/queries/review";

export const dynamic = "force-dynamic";

export default async function FeeRulesPage() {
    const rules = await listFeeRulesForReview();
    const active = rules.filter((rule) => rule.status === "active").length;
    const needsReview = rules.filter(
        (rule) => rule.status === "needs_review" || rule.status === "extracted"
    ).length;
    const rejected = rules.filter((rule) => rule.status === "rejected").length;

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                description="Review admin fees, warehouse fees, minimum weight, PPN, and surcharge notes used by quote calculation."
                eyebrow="Quote controls"
                title="Fee rules"
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Rules", value: rules.length },
                    {
                        label: "Needs review",
                        tone: "warning",
                        value: needsReview,
                    },
                    { label: "Active", tone: "success", value: active },
                    { label: "Rejected", tone: "danger", value: rejected },
                ]}
            />
            <FeeRuleTable rules={rules} />
        </div>
    );
}
