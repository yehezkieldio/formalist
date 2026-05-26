import {
    ArrowRightIcon,
    BoxesIcon,
    DatabaseIcon,
    FileTextIcon,
    ListChecksIcon,
    SettingsIcon,
    ShieldCheckIcon,
    TagsIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

const sections = [
    {
        className: "md:col-span-7",
        description: "Upload source documents and monitor ingestion.",
        href: "/admin/documents",
        icon: FileTextIcon,
        intent: "Source intake",
        title: "Documents",
    },
    {
        className: "md:col-span-5",
        description: "Inspect semantic and table-aware chunks.",
        href: "/admin/chunks",
        icon: DatabaseIcon,
        intent: "Retrieval memory",
        title: "Chunks",
    },
    {
        className: "md:col-span-4",
        description: "Review extracted structured facts.",
        href: "/admin/facts",
        icon: ShieldCheckIcon,
        intent: "Trust gate",
        title: "Facts",
    },
    {
        className: "md:col-span-4",
        description: "Approve or reject extracted tariff rows.",
        href: "/admin/review",
        icon: ListChecksIcon,
        intent: "Price review",
        title: "Tariff review",
    },
    {
        className: "md:col-span-4",
        description: "Review fees, PPN, surcharges, and minimums.",
        href: "/admin/fee-rules",
        icon: BoxesIcon,
        intent: "Quote rules",
        title: "Fee rules",
    },
    {
        className: "md:col-span-6",
        description: "Manage route, city, airport, and airline aliases.",
        href: "/admin/aliases",
        icon: TagsIcon,
        intent: "Disambiguation",
        title: "Aliases",
    },
    {
        className: "md:col-span-6",
        description: "Configure deployment, retrieval, storage, and UI.",
        href: "/admin/settings",
        icon: SettingsIcon,
        intent: "System controls",
        title: "Settings",
    },
] as const;

export default function AdminDashboardPage() {
    return (
        <div className="grid gap-8">
            <header className="grid gap-5 border-border/80 border-b pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="grid gap-2">
                    <h1 className="font-semibold text-3xl tracking-tight">
                        Admin dashboard
                    </h1>
                    <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                        Review extracted cargo tariff memory before it becomes
                        trusted. Documents, facts, tariff rows, fee rules, and
                        aliases stay separated so review work stays auditable.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Protected</Badge>
                    <Badge variant="outline">Local review</Badge>
                </div>
            </header>

            <section className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-12">
                {sections.map((section) => {
                    const Icon = section.icon;

                    return (
                        <Link
                            className={cn(
                                "group grid min-h-36 bg-muted/25 p-5 text-card-foreground transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
                                section.className
                            )}
                            href={section.href}
                            key={section.href}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="grid gap-3">
                                    <span className="flex size-9 items-center justify-center bg-background">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </span>
                                    <div className="grid gap-1">
                                        <p className="font-medium text-base">
                                            {section.title}
                                        </p>
                                        <p className="max-w-md text-muted-foreground text-sm leading-6">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRightIcon
                                    aria-hidden="true"
                                    className="mt-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                                />
                            </div>
                            <p className="mt-8 border-border/80 border-t pt-3 text-muted-foreground text-xs">
                                {section.intent}
                            </p>
                        </Link>
                    );
                })}
            </section>

            <section className="grid gap-3 border-border/80 border-t pt-6 md:grid-cols-[minmax(0,1fr)_18rem]">
                <div>
                    <h2 className="font-medium text-lg">Review posture</h2>
                    <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
                        Keep uploaded evidence, extracted facts, tariff rows,
                        and quote rules reviewable before they affect answers.
                        The chat assistant should cite sources; this surface is
                        where trust is granted or withheld.
                    </p>
                </div>
                <Link
                    className="inline-flex h-10 items-center justify-center gap-2 bg-muted px-3 text-sm transition-colors hover:bg-muted/70 active:translate-y-px"
                    href="/chat"
                >
                    Return to chat
                    <ArrowRightIcon aria-hidden="true" className="size-4" />
                </Link>
            </section>
        </div>
    );
}
