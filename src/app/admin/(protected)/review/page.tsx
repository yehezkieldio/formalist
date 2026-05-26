import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { TariffReviewTable } from "#/components/admin/tariff-review-table";
import { listTariffRowsForReview } from "#/server/db/queries/review";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
    const rows = await listTariffRowsForReview();
    const active = rows.filter((row) => row.status === "active").length;
    const needsReview = rows.filter(
        (row) => row.status === "needs_review" || row.status === "extracted"
    ).length;
    const priced = rows.filter((row) => row.smuPricePerKg !== null).length;
    const rejected = rows.filter((row) => row.status === "rejected").length;

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                description="Correct airline, destination, price, and route fields before rows power verified numeric answers."
                eyebrow="Pricing memory"
                title="Tariff review"
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Rows", value: rows.length },
                    { label: "Priced", value: priced },
                    {
                        label: "Needs review",
                        tone: "warning",
                        value: needsReview,
                    },
                    { label: "Active", tone: "success", value: active },
                    { label: "Rejected", tone: "danger", value: rejected },
                ]}
            />
            <TariffReviewTable rows={rows} />
        </div>
    );
}
