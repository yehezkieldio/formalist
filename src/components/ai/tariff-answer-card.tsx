import { ArrowRightIcon, FileTextIcon, PlaneTakeoffIcon } from "lucide-react";

import type { TariffAnswerData } from "#/components/ai/types";
import { cn } from "#/lib/utils";

function formatPrice(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}/kg`;
}

function formatDocumentId(value: string) {
    return value.slice(0, 8);
}

function routeLabel(row: TariffAnswerData["rows"][number]) {
    if (row.routeType === "TRANSIT" && row.transitRoute) {
        return `${row.routeType} VIA ${row.transitRoute}`;
    }

    return row.routeType;
}

export function TariffAnswerCard({ data }: { data: TariffAnswerData }) {
    const sortedRows = data.rows.toSorted(
        (left, right) => left.smuPricePerKg - right.smuPricePerKg
    );
    const [lowestRow] = sortedRows;

    if (!lowestRow) {
        return null;
    }

    return (
        <section className="overflow-hidden border border-border/60 bg-muted/5 rounded-none my-4 shadow-sm select-text">
            <div className="grid gap-4 border-b border-border/40 bg-muted/10 p-5 sm:grid-cols-[1fr_auto] items-center">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/80 select-none">
                        <PlaneTakeoffIcon
                            aria-hidden="true"
                            className="size-3 text-muted-foreground/70"
                        />
                        HARGA SMU AKTIF
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                        <span>{data.airline ?? "MASKAPAI"}</span>
                        <ArrowRightIcon
                            aria-hidden="true"
                            className="size-3.5 text-muted-foreground/50"
                        />
                        <span>{data.destination}</span>
                    </div>
                </div>
                <div className="sm:text-right select-none">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                        MULAI DARI
                    </div>
                    <div className="font-mono font-bold text-xl leading-none text-foreground mt-1">
                        {formatPrice(lowestRow.smuPricePerKg)}
                    </div>
                </div>
            </div>

            <div className="divide-y divide-border/40">
                {sortedRows.map((row, index) => (
                    <div
                        className="grid gap-4 px-5 py-4 transition-colors duration-200 hover:bg-muted/10 sm:grid-cols-[minmax(0,1fr)_auto] items-center"
                        key={`${row.documentId}-${row.pageNumber ?? "page"}-${row.smuPricePerKg}-${index}`}
                    >
                        <div className="min-w-0 space-y-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-semibold text-xs tracking-tight text-foreground/90">
                                    {row.originCity ?? "Origin tidak tercatat"}
                                </span>
                                <ArrowRightIcon
                                    aria-hidden="true"
                                    className="size-3 text-muted-foreground/55"
                                />
                                <span className="font-semibold text-xs tracking-tight text-foreground/90">
                                    {row.destinationCity ?? data.destination}
                                </span>
                                {row.destinationCode ? (
                                    <span className="font-mono text-[9px] tracking-wider text-muted-foreground bg-muted/20 px-1 py-0.5 border border-border/40 uppercase select-none">
                                        {row.destinationCode}
                                    </span>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-muted-foreground/75 font-mono text-[9px] select-none">
                                <span className="uppercase">
                                    {routeLabel(row)}
                                </span>
                                <span className="• text-muted-foreground/30">
                                    •
                                </span>
                                <span
                                    className={cn(
                                        "px-1 py-0.2 border rounded-none font-semibold uppercase text-[8px] tracking-wider",
                                        row.isPromo
                                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                                            : "border-border bg-muted/25 text-muted-foreground/70"
                                    )}
                                >
                                    {row.isPromo ? "promo" : "regular"}
                                </span>
                                <span className="• text-muted-foreground/30">
                                    •
                                </span>
                                <span className="inline-flex items-center gap-1 text-muted-foreground/55">
                                    <FileTextIcon
                                        aria-hidden="true"
                                        className="size-2.5 text-muted-foreground/60"
                                    />
                                    DOC // {formatDocumentId(row.documentId)}
                                    {row.pageNumber
                                        ? `, PG ${row.pageNumber}`
                                        : ""}
                                </span>
                            </div>
                        </div>
                        <div className="font-mono font-semibold text-sm sm:text-right text-foreground">
                            {formatPrice(row.smuPricePerKg)}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
