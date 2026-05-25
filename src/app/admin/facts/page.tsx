import { FactReviewTable } from "#/components/admin/fact-review-table";
import { listFactsForReview } from "#/server/db/queries/review";

export default async function FactsPage() {
    const facts = await listFactsForReview();

    return (
        <div className="grid gap-6">
            <section>
                <h1 className="font-semibold text-2xl">Facts</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Review extracted structured facts before trust activation.
                </p>
            </section>
            <FactReviewTable facts={facts} />
        </div>
    );
}
