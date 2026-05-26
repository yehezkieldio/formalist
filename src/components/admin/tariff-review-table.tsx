"use client";

/* eslint-disable no-use-before-define */

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "#/components/ui/button";
import type { PriceStatus, ReviewStatus, RouteType } from "#/server/db/schema";

import { AdminEmptyState, ReviewStatusBadge } from "./admin-primitives";
import { SourceSnippetPreview } from "./source-snippet-preview";

interface TariffRow {
    airline: string | null;
    destinationCity: string | null;
    destinationCode: string | null;
    flightNumber: string | null;
    id: string;
    priceStatus: PriceStatus;
    rawRowText: string | null;
    routeType: RouteType;
    schedule: string | null;
    smuPricePerKg: number | null;
    status: ReviewStatus;
    transitRoute: string | null;
}

const routeTypes: RouteType[] = ["DIRECT", "TRANSIT", "ANY", "UNKNOWN"];
const priceStatuses: PriceStatus[] = ["NUMERIC", "NA", "MISSING"];

function formatPrice(value: number | null) {
    return value === null ? "N/A" : `Rp ${value.toLocaleString("id-ID")}/kg`;
}

function rowText(row: TariffRow) {
    return [
        row.airline,
        row.destinationCity,
        row.destinationCode,
        row.flightNumber,
        row.routeType,
        row.priceStatus,
        row.schedule,
        row.transitRoute,
        row.status,
        row.rawRowText,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export function TariffReviewTable({ rows }: { rows: TariffRow[] }) {
    const [records, setRecords] = useState(rows);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<ReviewStatus | "all">("all");
    const filteredRows = useMemo(
        () =>
            records.filter((row) => {
                const matchesStatus = status === "all" || row.status === status;
                const matchesQuery =
                    query.trim().length === 0 ||
                    rowText(row).includes(query.toLowerCase());

                return matchesStatus && matchesQuery;
            }),
        [query, records, status]
    );

    const updateRow = (updated: TariffRow) => {
        setRecords((current) =>
            current.map((row) => (row.id === updated.id ? updated : row))
        );
    };

    if (records.length === 0) {
        return (
            <AdminEmptyState
                description="Upload tariff documents to populate editable route price rows."
                icon={SearchIcon}
                title="No tariff rows yet"
            />
        );
    }

    return (
        <section className="grid gap-4">
            <div className="grid gap-3 border bg-muted/10 p-3 md:grid-cols-[minmax(0,1fr)_12rem]">
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Search rows
                    </span>
                    <input
                        aria-label="Search tariff rows"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="airline, route, destination, schedule"
                        value={query}
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Status
                    </span>
                    <select
                        aria-label="Filter tariff status"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                            setStatus(
                                event.target.value as ReviewStatus | "all"
                            )
                        }
                        value={status}
                    >
                        <option value="all">All states</option>
                        <option value="extracted">Extracted</option>
                        <option value="needs_review">Needs review</option>
                        <option value="active">Active</option>
                        <option value="rejected">Rejected</option>
                        <option value="archived">Archived</option>
                    </select>
                </label>
            </div>
            <div className="grid gap-3">
                {filteredRows.map((row) => (
                    <TariffReviewRow
                        key={row.id}
                        onUpdate={updateRow}
                        row={row}
                    />
                ))}
            </div>
        </section>
    );
}

function TariffReviewRow({
    onUpdate,
    row,
}: {
    onUpdate: (row: TariffRow) => void;
    row: TariffRow;
}) {
    const [draft, setDraft] = useState({
        airline: row.airline ?? "",
        destinationCity: row.destinationCity ?? "",
        destinationCode: row.destinationCode ?? "",
        flightNumber: row.flightNumber ?? "",
        priceStatus: row.priceStatus,
        routeType: row.routeType,
        schedule: row.schedule ?? "",
        smuPricePerKg: row.smuPricePerKg?.toString() ?? "",
        transitRoute: row.transitRoute ?? "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const save = (nextStatus?: ReviewStatus) => {
        setError(null);
        startTransition(async () => {
            const response = await fetch(`/api/review/tariff-rows/${row.id}`, {
                body: JSON.stringify({
                    airline: draft.airline.trim() || null,
                    destinationCity: draft.destinationCity.trim() || null,
                    destinationCode: draft.destinationCode.trim() || null,
                    flightNumber: draft.flightNumber.trim() || null,
                    priceStatus: draft.priceStatus,
                    routeType: draft.routeType,
                    schedule: draft.schedule.trim() || null,
                    smuPricePerKg:
                        draft.smuPricePerKg.trim().length > 0
                            ? Number(draft.smuPricePerKg)
                            : null,
                    status: nextStatus,
                    transitRoute: draft.transitRoute.trim() || null,
                }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as {
                    error?: string;
                };
                setError(data.error ?? "Could not update tariff row.");
                return;
            }

            const data = (await response.json()) as { row: TariffRow };
            onUpdate(data.row);
        });
    };

    return (
        <article className="grid gap-3 border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">
                            {row.airline ?? "Unknown airline"} to{" "}
                            {row.destinationCity ?? "Unknown destination"}
                        </p>
                        <ReviewStatusBadge status={row.status} />
                    </div>
                    <p className="font-mono text-muted-foreground text-xs">
                        {row.destinationCode ?? "NO CODE"} · {row.routeType} ·{" "}
                        {formatPrice(row.smuPricePerKg)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        disabled={isPending}
                        onClick={() => save("active")}
                        size="sm"
                        type="button"
                    >
                        <CheckIcon aria-hidden="true" />
                        Activate
                    </Button>
                    <Button
                        disabled={isPending}
                        onClick={() => save("rejected")}
                        size="sm"
                        type="button"
                        variant="destructive"
                    >
                        <XIcon aria-hidden="true" />
                        Reject
                    </Button>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <TextField
                    label="Airline"
                    onChange={(value) => setDraft({ ...draft, airline: value })}
                    value={draft.airline}
                />
                <TextField
                    label="Destination city"
                    onChange={(value) =>
                        setDraft({ ...draft, destinationCity: value })
                    }
                    value={draft.destinationCity}
                />
                <TextField
                    label="Destination code"
                    onChange={(value) =>
                        setDraft({ ...draft, destinationCode: value })
                    }
                    value={draft.destinationCode}
                />
                <TextField
                    label="SMU price per kg"
                    onChange={(value) =>
                        setDraft({ ...draft, smuPricePerKg: value })
                    }
                    type="number"
                    value={draft.smuPricePerKg}
                />
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Route type
                    </span>
                    <select
                        aria-label="Route type"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                routeType: event.target.value as RouteType,
                            })
                        }
                        value={draft.routeType}
                    >
                        {routeTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Price status
                    </span>
                    <select
                        aria-label="Price status"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                priceStatus: event.target.value as PriceStatus,
                            })
                        }
                        value={draft.priceStatus}
                    >
                        {priceStatuses.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
                <TextField
                    label="Flight"
                    onChange={(value) =>
                        setDraft({ ...draft, flightNumber: value })
                    }
                    value={draft.flightNumber}
                />
                <TextField
                    label="Schedule"
                    onChange={(value) =>
                        setDraft({ ...draft, schedule: value })
                    }
                    value={draft.schedule}
                />
                <TextField
                    label="Transit route"
                    onChange={(value) =>
                        setDraft({ ...draft, transitRoute: value })
                    }
                    value={draft.transitRoute}
                />
            </div>
            {error ? (
                <p className="border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
                    {error}
                </p>
            ) : null}
            <SourceSnippetPreview
                snippet={row.rawRowText}
                sourceType="tariff_row"
            />
            <div>
                <Button
                    disabled={isPending}
                    onClick={() => save()}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    Save row
                </Button>
            </div>
        </article>
    );
}

function TextField({
    label,
    onChange,
    type = "text",
    value,
}: {
    label: string;
    onChange: (value: string) => void;
    type?: "number" | "text";
    value: string;
}) {
    return (
        <label className="grid gap-1 text-sm">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
                {label}
            </span>
            <input
                aria-label={label}
                className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
            />
        </label>
    );
}
