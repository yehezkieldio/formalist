import { ArrowRightIcon, FileTextIcon, PlaneTakeoffIcon } from "lucide-react";

import type { TariffAnswerData } from "#/components/ai/types";

function formatPrice(value: number) {
    return `Rp ${value.toLocaleString("id-ID")}/kg`;
}

function formatDocumentId(value: string) {
    return value.slice(0, 8);
}

function routeLabel(row: TariffAnswerData["rows"][number]) {
    if (row.routeType === "TRANSIT" && row.transitRoute) {
        return `${row.routeType} via ${row.transitRoute}`;
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
        <section className="overflow-hidden border bg-card text-card-foreground">
            <div className="grid gap-4 border-b bg-muted/25 p-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.14em]">
                        <PlaneTakeoffIcon
                            aria-hidden="true"
                            className="size-3.5"
                        />
                        Harga SMU aktif
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-base">
                        <span>{data.airline ?? "Maskapai"}</span>
                        <ArrowRightIcon
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                        />
                        <span>{data.destination}</span>
                    </div>
                </div>
                <div className="sm:text-right">
                    <div className="text-muted-foreground text-xs">
                        Mulai dari
                    </div>
                    <div className="font-mono font-semibold text-2xl leading-tight">
                        {formatPrice(lowestRow.smuPricePerKg)}
                    </div>
                </div>
            </div>

            <div className="divide-y">
                {sortedRows.map((row, index) => (
                    <div
                        className="grid gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto]"
                        key={`${row.documentId}-${row.pageNumber ?? "page"}-${row.smuPricePerKg}-${index}`}
                    >
                        <div className="min-w-0 space-y-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-medium">
                                    {row.originCity ?? "Origin tidak tercatat"}
                                </span>
                                <ArrowRightIcon
                                    aria-hidden="true"
                                    className="size-3.5 text-muted-foreground"
                                />
                                <span className="font-medium">
                                    {row.destinationCity ?? data.destination}
                                </span>
                                {row.destinationCode ? (
                                    <span className="text-muted-foreground">
                                        {row.destinationCode}
                                    </span>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                                <span>{routeLabel(row)}</span>
                                <span>{row.isPromo ? "promo" : "regular"}</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <FileTextIcon
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    doc {formatDocumentId(row.documentId)}
                                    {row.pageNumber
                                        ? `, page ${row.pageNumber}`
                                        : ""}
                                </span>
                            </div>
                        </div>
                        <div className="font-mono font-semibold text-base sm:text-right">
                            {formatPrice(row.smuPricePerKg)}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
