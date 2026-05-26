"use client";

/* eslint-disable no-use-before-define */

import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "#/components/ui/button";
import type { ReviewStatus } from "#/server/db/schema";

import { AdminEmptyState, ReviewStatusBadge } from "./admin-primitives";
import { SourceSnippetPreview } from "./source-snippet-preview";

interface FactRow {
    destinationCity: string | null;
    factType: string;
    id: string;
    rawEvidence: string | null;
    status: ReviewStatus;
    valueNumber: string | null;
    valueText: string | null;
}

function rowText(row: FactRow) {
    return [
        row.factType,
        row.destinationCity,
        row.valueText,
        row.valueNumber,
        row.status,
        row.rawEvidence,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export function FactReviewTable({ facts }: { facts: FactRow[] }) {
    const [rows, setRows] = useState(facts);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<ReviewStatus | "all">("all");
    const filteredRows = useMemo(
        () =>
            rows.filter((row) => {
                const matchesStatus = status === "all" || row.status === status;
                const matchesQuery =
                    query.trim().length === 0 ||
                    rowText(row).includes(query.toLowerCase());

                return matchesStatus && matchesQuery;
            }),
        [query, rows, status]
    );

    const updateRow = (updated: FactRow) => {
        setRows((current) =>
            current.map((row) => (row.id === updated.id ? updated : row))
        );
    };

    if (rows.length === 0) {
        return (
            <AdminEmptyState
                description="Upload and ingest a document to populate structured facts for review."
                icon={SearchIcon}
                title="No extracted facts yet"
            />
        );
    }

    return (
        <section className="grid gap-4">
            <div className="grid gap-3 border bg-muted/10 p-3 md:grid-cols-[minmax(0,1fr)_12rem]">
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Search facts
                    </span>
                    <input
                        aria-label="Search facts"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="destination, fact, evidence"
                        value={query}
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Status
                    </span>
                    <select
                        aria-label="Filter fact status"
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
                {filteredRows.map((fact) => (
                    <FactReviewRow
                        key={fact.id}
                        fact={fact}
                        onUpdate={updateRow}
                    />
                ))}
            </div>
        </section>
    );
}

function FactReviewRow({
    fact,
    onUpdate,
}: {
    fact: FactRow;
    onUpdate: (fact: FactRow) => void;
}) {
    const [draft, setDraft] = useState({
        valueNumber: fact.valueNumber ?? "",
        valueText: fact.valueText ?? "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const save = (nextStatus?: ReviewStatus) => {
        setError(null);
        startTransition(async () => {
            const response = await fetch(`/api/facts/${fact.id}`, {
                body: JSON.stringify({
                    status: nextStatus,
                    valueNumber: draft.valueNumber.trim() || null,
                    valueText: draft.valueText.trim() || null,
                }),
                headers: { "content-type": "application/json" },
                method: "PUT",
            });

            if (!response.ok) {
                const data = (await response.json().catch(() => ({}))) as {
                    error?: string;
                };
                setError(data.error ?? "Could not update fact.");
                return;
            }

            const data = (await response.json()) as { fact: FactRow };
            onUpdate(data.fact);
        });
    };

    return (
        <article className="grid gap-3 border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">{fact.factType}</p>
                        <ReviewStatusBadge status={fact.status} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {fact.destinationCity ?? "No destination"}
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
            <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Value text
                    </span>
                    <input
                        aria-label="Fact value text"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                valueText: event.target.value,
                            })
                        }
                        value={draft.valueText}
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Numeric value
                    </span>
                    <input
                        aria-label="Fact numeric value"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                valueNumber: event.target.value,
                            })
                        }
                        value={draft.valueNumber}
                    />
                </label>
            </div>
            {error ? (
                <p className="border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
                    {error}
                </p>
            ) : null}
            <SourceSnippetPreview
                snippet={fact.rawEvidence}
                sourceType="extracted_fact"
            />
            <div>
                <Button
                    disabled={isPending}
                    onClick={() => save()}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    Save values
                </Button>
            </div>
        </article>
    );
}
