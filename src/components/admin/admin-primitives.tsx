import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

export function AdminPageHeader({
    actions,
    description,
    eyebrow,
    title,
}: {
    actions?: ReactNode;
    description: string;
    eyebrow?: string;
    title: string;
}) {
    return (
        <header className="grid gap-4 border-border/80 border-b pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-2">
                {eyebrow ? (
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="font-semibold text-3xl tracking-tight">
                    {title}
                </h1>
                <p className="max-w-2xl text-muted-foreground text-sm leading-6">
                    {description}
                </p>
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            ) : null}
        </header>
    );
}

export function AdminMetricStrip({
    metrics,
}: {
    metrics: {
        label: string;
        tone?: "default" | "danger" | "success" | "warning";
        value: ReactNode;
    }[];
}) {
    return (
        <section className="grid grid-cols-2 border-border border-t border-l bg-muted/5 font-mono text-xs md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {metrics.map((metric) => (
                <div
                    className="border-border border-r border-b p-4"
                    key={metric.label}
                >
                    <p className="font-semibold text-[10px] text-muted-foreground/70 uppercase">
                        {metric.label}
                    </p>
                    <p
                        className={cn(
                            "mt-1 text-lg font-bold text-foreground",
                            metric.tone === "danger" && "text-destructive",
                            metric.tone === "success" && "text-emerald-500",
                            metric.tone === "warning" && "text-amber-500"
                        )}
                    >
                        {metric.value}
                    </p>
                </div>
            ))}
        </section>
    );
}

export function AdminEmptyState({
    description,
    icon: Icon,
    title,
}: {
    description: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <div className="grid min-h-56 place-items-center border border-dashed bg-muted/10 p-8 text-center">
            <div className="grid max-w-sm place-items-center gap-3">
                <span className="flex size-10 items-center justify-center border bg-background">
                    <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="grid gap-1">
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-muted-foreground text-xs leading-5">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function ReviewStatusBadge({ status }: { status: string }) {
    if (status === "active") {
        return (
            <Badge className="border-emerald-500/25 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                active
            </Badge>
        );
    }

    if (status === "needs_review" || status === "extracted") {
        return (
            <Badge className="border-amber-500/25 bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">
                {status}
            </Badge>
        );
    }

    if (status === "rejected") {
        return <Badge variant="destructive">rejected</Badge>;
    }

    return <Badge variant="outline">{status}</Badge>;
}
