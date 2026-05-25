import { TariffReviewTable } from "#/components/admin/tariff-review-table";
import { listTariffRowsForReview } from "#/server/db/queries/review";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
    const rows = await listTariffRowsForReview();

    return (
        <div className="grid gap-6">
            <section>
                <h1 className="font-semibold text-2xl">Tariff Review</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Review extracted tariff rows before they become active.
                </p>
            </section>
            <TariffReviewTable rows={rows} />
        </div>
    );
}
