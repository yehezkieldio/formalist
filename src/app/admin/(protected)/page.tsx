import { count, eq, or } from "drizzle-orm";
import {
    AlertTriangleIcon,
    ArrowRightIcon,
    CheckCircle2Icon,
    FileTextIcon,
    SettingsIcon,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { getDatabase } from "#/server/db";
import { activatePendingReviewRecords } from "#/server/db/queries/review";
import {
    documents,
    extractionIssues,
    extractedFacts,
    feeRules,
    tariffRows,
} from "#/server/db/schema";

export const dynamic = "force-dynamic";

async function getAdminStats() {
    const db = getDatabase();

    const [
        docsCount,
        factsCount,
        pendingFactsCount,
        rowsCount,
        pendingRowsCount,
        rulesCount,
        pendingRulesCount,
        openIssuesCount,
    ] = await Promise.all([
        db.select({ count: count() }).from(documents),
        db.select({ count: count() }).from(extractedFacts),
        db
            .select({ count: count() })
            .from(extractedFacts)
            .where(
                or(
                    eq(extractedFacts.status, "extracted"),
                    eq(extractedFacts.status, "needs_review")
                )
            ),
        db.select({ count: count() }).from(tariffRows),
        db
            .select({ count: count() })
            .from(tariffRows)
            .where(
                or(
                    eq(tariffRows.status, "extracted"),
                    eq(tariffRows.status, "needs_review")
                )
            ),
        db.select({ count: count() }).from(feeRules),
        db
            .select({ count: count() })
            .from(feeRules)
            .where(
                or(
                    eq(feeRules.status, "extracted"),
                    eq(feeRules.status, "needs_review")
                )
            ),
        db
            .select({ count: count() })
            .from(extractionIssues)
            .where(eq(extractionIssues.status, "open")),
    ]);

    const docs = docsCount[0]?.count ?? 0;
    const facts = factsCount[0]?.count ?? 0;
    const pendingFacts = pendingFactsCount[0]?.count ?? 0;
    const rows = rowsCount[0]?.count ?? 0;
    const pendingRows = pendingRowsCount[0]?.count ?? 0;
    const rules = rulesCount[0]?.count ?? 0;
    const pendingRules = pendingRulesCount[0]?.count ?? 0;
    const openIssues = openIssuesCount[0]?.count ?? 0;

    return {
        docs,
        facts,
        openIssues,
        pendingFacts,
        pendingRows,
        pendingRules,
        rows,
        rules,
    };
}

async function approveAllAction() {
    "use server";
    await activatePendingReviewRecords();
    revalidatePath("/admin");
}

export default async function AdminDashboardPage() {
    const stats = await getAdminStats();
    const pendingTotal =
        stats.pendingFacts + stats.pendingRows + stats.pendingRules;

    const sections = [
        {
            className: "md:col-span-8",
            description:
                "Upload pricelist sheets, open ingestion issues, and inspect extracted records by document.",
            href: "/admin/documents",
            icon: FileTextIcon,
            intent: `${stats.docs} documents • ${pendingTotal} review backlog`,
            title: "Documents",
        },
        {
            className: "md:col-span-4",
            description: "Adjust parser models, retrieval weights, and modes.",
            href: "/admin/settings",
            icon: SettingsIcon,
            intent: "System Controls & Credentials",
            title: "Settings",
        },
    ] as const;

    return (
        <div className="grid gap-8">
            {/* Header section */}
            <header className="grid gap-5 border-border/80 border-b pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="grid gap-2">
                    <h1 className="font-semibold text-3xl tracking-tight">
                        Admin dashboard
                    </h1>
                    <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                        Verify extracted cargo tariff pricing memory before it
                        becomes trusted. Review backlog metrics are updated in
                        real-time.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 select-none font-mono">
                    <Badge variant="secondary">Protected</Badge>
                    {pendingTotal > 0 ? (
                        <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-amber-500/25">
                            Action Required
                        </Badge>
                    ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/25">
                            Queue Clear
                        </Badge>
                    )}
                </div>
            </header>

            {/* Quick Metrics Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-border bg-muted/5 font-mono text-xs select-none">
                <div className="border-r border-b border-border p-4">
                    <p className="text-muted-foreground/60 text-[10px] uppercase font-semibold">
                        Backlog Items
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                        {pendingTotal}
                    </p>
                </div>
                <div className="border-r border-b border-border p-4">
                    <p className="text-muted-foreground/60 text-[10px] uppercase font-semibold">
                        Active Facts
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                        {stats.facts - stats.pendingFacts}
                    </p>
                </div>
                <div className="border-r border-b border-border p-4">
                    <p className="text-muted-foreground/60 text-[10px] uppercase font-semibold">
                        Active Rows
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                        {stats.rows - stats.pendingRows}
                    </p>
                </div>
                <div className="border-r border-b border-border p-4">
                    <p className="text-muted-foreground/60 text-[10px] uppercase font-semibold">
                        Ingested Pages
                    </p>
                    <p className="text-lg font-bold text-foreground mt-1">
                        {stats.docs}
                    </p>
                </div>
            </section>

            {/* Main Bento Navigation */}
            <section className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-12">
                {sections.map((section) => {
                    const Icon = section.icon;

                    return (
                        <Link
                            className={cn(
                                "group flex min-h-36 flex-col justify-between bg-muted/20 border border-border p-5 text-card-foreground transition-all duration-300 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-foreground/50 active:scale-[0.99]",
                                section.className
                            )}
                            href={section.href}
                            key={section.href}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="grid gap-3">
                                    <span className="flex size-9 items-center justify-center bg-background border border-border">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4 text-foreground/80"
                                        />
                                    </span>
                                    <div className="grid gap-1">
                                        <p className="font-semibold text-base tracking-tight text-foreground">
                                            {section.title}
                                        </p>
                                        <p className="max-w-md text-muted-foreground text-xs leading-5">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRightIcon
                                    aria-hidden="true"
                                    className="mt-2 size-4 text-muted-foreground/55 transition-transform group-hover:translate-x-0.5"
                                />
                            </div>
                            <p className="mt-6 border-border/40 border-t pt-3 text-muted-foreground text-[10px] font-mono tracking-tight">
                                {section.intent}
                            </p>
                        </Link>
                    );
                })}
            </section>

            {/* Action Bar / Review Posture */}
            <section className="grid gap-6 border-border/80 border-t pt-6 md:grid-cols-[minmax(0,1fr)_20rem] items-center">
                <div>
                    <h2 className="font-semibold text-lg tracking-tight">
                        Review posture
                    </h2>
                    <p className="mt-1 max-w-2xl text-muted-foreground text-xs leading-5">
                        Keep extracted facts and pricing rules reviewable before
                        they power search answers. Verified mode ensures no raw,
                        unverified text is ever used for numeric calculations.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {pendingTotal > 0 ? (
                        <form action={approveAllAction}>
                            <Button className="w-full h-10 gap-2 border bg-amber-500 text-background hover:bg-amber-500/90 font-mono text-xs cursor-pointer select-none">
                                <AlertTriangleIcon className="size-4" />
                                Activate All Pending ({pendingTotal})
                            </Button>
                        </form>
                    ) : (
                        <div className="flex h-10 items-center justify-center gap-2 border border-emerald-500/25 bg-emerald-500/5 px-3 py-1 font-mono text-xs text-emerald-500 select-none">
                            <CheckCircle2Icon className="size-4" />
                            All Records Active & Verified
                        </div>
                    )}
                    <Button
                        asChild
                        className="w-full h-10 font-mono text-xs"
                        variant="outline"
                    >
                        <Link href="/chat">
                            Return to chat
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
