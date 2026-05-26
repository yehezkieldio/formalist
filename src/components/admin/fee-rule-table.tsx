"use client";

/* eslint-disable no-use-before-define */

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "#/components/ui/button";
import type { ReviewStatus } from "#/server/db/schema";

import { AdminEmptyState, ReviewStatusBadge } from "./admin-primitives";

interface FeeRule {
    adminFeePerSmu: number | null;
    airline: string | null;
    dgSurcharge: number | null;
    id: string;
    minWeightKg: string | null;
    notes: string | null;
    ppnPercent: string | null;
    status: ReviewStatus;
    warehouseAdminPerSmu: number | null;
    warehouseFeePerKg: number | null;
}

function rowText(row: FeeRule) {
    return [
        row.airline,
        row.adminFeePerSmu,
        row.warehouseFeePerKg,
        row.warehouseAdminPerSmu,
        row.dgSurcharge,
        row.minWeightKg,
        row.ppnPercent,
        row.notes,
        row.status,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export function FeeRuleTable({ rules }: { rules: FeeRule[] }) {
    const [records, setRecords] = useState(rules);
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

    const updateRow = (updated: FeeRule) => {
        setRecords((current) =>
            current.map((row) => (row.id === updated.id ? updated : row))
        );
    };

    if (records.length === 0) {
        return (
            <AdminEmptyState
                description="Fee rules appear after documents are extracted or when defaults are detected."
                icon={SearchIcon}
                title="No fee rules yet"
            />
        );
    }

    return (
        <section className="grid gap-4">
            <div className="grid gap-3 border bg-muted/10 p-3 md:grid-cols-[minmax(0,1fr)_12rem]">
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Search rules
                    </span>
                    <input
                        aria-label="Search fee rules"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="airline, notes, fee"
                        value={query}
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Status
                    </span>
                    <select
                        aria-label="Filter fee rule status"
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
                {filteredRows.map((rule) => (
                    <FeeRuleRow
                        key={rule.id}
                        onUpdate={updateRow}
                        rule={rule}
                    />
                ))}
            </div>
        </section>
    );
}

function FeeRuleRow({
    onUpdate,
    rule,
}: {
    onUpdate: (rule: FeeRule) => void;
    rule: FeeRule;
}) {
    const [draft, setDraft] = useState({
        adminFeePerSmu: rule.adminFeePerSmu?.toString() ?? "",
        dgSurcharge: rule.dgSurcharge?.toString() ?? "",
        minWeightKg: rule.minWeightKg ?? "",
        notes: rule.notes ?? "",
        ppnPercent: rule.ppnPercent ?? "",
        warehouseAdminPerSmu: rule.warehouseAdminPerSmu?.toString() ?? "",
        warehouseFeePerKg: rule.warehouseFeePerKg?.toString() ?? "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const save = (nextStatus?: ReviewStatus) => {
        setError(null);
        startTransition(async () => {
            const response = await fetch(`/api/review/fee-rules/${rule.id}`, {
                body: JSON.stringify({
                    adminFeePerSmu: numberOrNull(draft.adminFeePerSmu),
                    dgSurcharge: numberOrNull(draft.dgSurcharge),
                    minWeightKg: draft.minWeightKg.trim() || null,
                    notes: draft.notes.trim() || null,
                    ppnPercent: draft.ppnPercent.trim() || null,
                    status: nextStatus,
                    warehouseAdminPerSmu: numberOrNull(
                        draft.warehouseAdminPerSmu
                    ),
                    warehouseFeePerKg: numberOrNull(draft.warehouseFeePerKg),
                }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as {
                    error?: string;
                };
                setError(data.error ?? "Could not update fee rule.");
                return;
            }

            const data = (await response.json()) as { rule: FeeRule };
            onUpdate(data.rule);
        });
    };

    return (
        <article className="grid gap-3 border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">
                            {rule.airline ?? "Document default fees"}
                        </p>
                        <ReviewStatusBadge status={rule.status} />
                    </div>
                    <p className="font-mono text-muted-foreground text-xs">
                        Admin {rule.adminFeePerSmu ?? "N/A"} · WH{" "}
                        {rule.warehouseFeePerKg ?? "N/A"} · PPN{" "}
                        {rule.ppnPercent ?? "N/A"}%
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
            <div className="grid gap-3 md:grid-cols-3">
                {(
                    [
                        ["Admin per SMU", "adminFeePerSmu"],
                        ["Warehouse per kg", "warehouseFeePerKg"],
                        ["Warehouse admin", "warehouseAdminPerSmu"],
                        ["DG surcharge", "dgSurcharge"],
                        ["Minimum kg", "minWeightKg"],
                        ["PPN percent", "ppnPercent"],
                    ] as const
                ).map(([label, key]) => (
                    <label className="grid gap-1 text-sm" key={key}>
                        <span className="font-mono text-[10px] text-muted-foreground uppercase">
                            {label}
                        </span>
                        <input
                            aria-label={label}
                            className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    [key]: event.target.value,
                                })
                            }
                            value={draft[key]}
                        />
                    </label>
                ))}
            </div>
            <label className="grid gap-1 text-sm">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                    Notes
                </span>
                <textarea
                    aria-label="Fee rule notes"
                    className="min-h-20 border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    onChange={(event) =>
                        setDraft({ ...draft, notes: event.target.value })
                    }
                    value={draft.notes}
                />
            </label>
            {error ? (
                <p className="border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
                    {error}
                </p>
            ) : null}
            <div>
                <Button
                    disabled={isPending}
                    onClick={() => save()}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    Save rule
                </Button>
            </div>
        </article>
    );
}

function numberOrNull(value: string) {
    return value.trim().length > 0 ? Number(value) : null;
}
