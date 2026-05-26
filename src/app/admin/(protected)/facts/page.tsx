import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { FactReviewTable } from "#/components/admin/fact-review-table";
import { listFactsForReview } from "#/server/db/queries/review";

export const dynamic = "force-dynamic";

export default async function FactsPage() {
    const facts = await listFactsForReview();
    const active = facts.filter((fact) => fact.status === "active").length;
    const needsReview = facts.filter(
        (fact) => fact.status === "needs_review" || fact.status === "extracted"
    ).length;
    const rejected = facts.filter((fact) => fact.status === "rejected").length;

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                description="Review extracted facts that shape entity lookup, validity notes, schedules, and non-tabular tariff evidence."
                eyebrow="Structured memory"
                title="Facts"
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Facts", value: facts.length },
                    {
                        label: "Needs review",
                        tone: "warning",
                        value: needsReview,
                    },
                    { label: "Active", tone: "success", value: active },
                    { label: "Rejected", tone: "danger", value: rejected },
                ]}
            />
            <FactReviewTable facts={facts} />
        </div>
    );
}
