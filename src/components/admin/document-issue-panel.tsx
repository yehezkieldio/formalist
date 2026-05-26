"use client";

/* eslint-disable no-use-before-define */

import { CheckCircle2Icon, CircleSlashIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "#/components/ui/button";
import type { IssueSeverity, IssueStatus } from "#/server/db/schema";

import { ReviewStatusBadge } from "./admin-primitives";

interface IssueRow {
    id: string;
    issueType: string;
    message: string;
    severity: IssueSeverity;
    sourceId: string | null;
    sourceType: string | null;
    status: IssueStatus;
}

function severityClass(severity: IssueSeverity) {
    if (severity === "high") {
        return "border-destructive/30 bg-destructive/10 text-destructive";
    }

    if (severity === "medium") {
        return "border-amber-500/25 bg-amber-500/10 text-amber-500";
    }

    return "border-border bg-muted/20 text-muted-foreground";
}

export function DocumentIssuePanel({ issues }: { issues: IssueRow[] }) {
    const [rows, setRows] = useState(issues);

    if (rows.length === 0) {
        return (
            <section className="border bg-muted/10 p-4">
                <h2 className="font-semibold text-sm">Extraction issues</h2>
                <p className="mt-2 text-muted-foreground text-xs leading-5">
                    No validation issues were recorded for this document.
                </p>
            </section>
        );
    }

    return (
        <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-sm">Extraction issues</h2>
                    <p className="mt-1 text-muted-foreground text-xs">
                        Resolve or ignore issues after correcting the linked
                        record.
                    </p>
                </div>
                <span className="font-mono text-muted-foreground text-xs">
                    {rows.filter((issue) => issue.status === "open").length}{" "}
                    open
                </span>
            </div>
            <div className="grid gap-2">
                {rows.map((issue) => (
                    <IssueCard
                        issue={issue}
                        key={issue.id}
                        onUpdate={(updated) =>
                            setRows((current) =>
                                current.map((row) =>
                                    row.id === updated.id ? updated : row
                                )
                            )
                        }
                    />
                ))}
            </div>
        </section>
    );
}

function IssueCard({
    issue,
    onUpdate,
}: {
    issue: IssueRow;
    onUpdate: (issue: IssueRow) => void;
}) {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const update = (status: IssueStatus) => {
        setError(null);
        startTransition(async () => {
            const response = await fetch(`/api/issues/${issue.id}`, {
                body: JSON.stringify({ status }),
                headers: { "content-type": "application/json" },
                method: "PATCH",
            });

            if (!response.ok) {
                setError("Could not update issue status.");
                return;
            }

            const data = (await response.json()) as { issue: IssueRow };
            onUpdate(data.issue);
        });
    };

    return (
        <article className="grid gap-3 border bg-card p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`border px-2 py-0.5 font-mono text-[10px] uppercase ${severityClass(issue.severity)}`}
                        >
                            {issue.severity}
                        </span>
                        <ReviewStatusBadge status={issue.status} />
                        <span className="font-mono text-muted-foreground text-[10px] uppercase">
                            {issue.issueType}
                        </span>
                    </div>
                    <p className="text-sm leading-5">{issue.message}</p>
                    <p className="font-mono text-muted-foreground text-[10px]">
                        {issue.sourceType ?? "document"}{" "}
                        {issue.sourceId ? issue.sourceId.slice(0, 8) : ""}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        disabled={isPending}
                        onClick={() => update("resolved")}
                        size="sm"
                        type="button"
                        variant="outline"
                    >
                        <CheckCircle2Icon aria-hidden="true" />
                        Resolve
                    </Button>
                    <Button
                        disabled={isPending}
                        onClick={() => update("ignored")}
                        size="sm"
                        type="button"
                        variant="ghost"
                    >
                        <CircleSlashIcon aria-hidden="true" />
                        Ignore
                    </Button>
                </div>
            </div>
            {error ? (
                <p className="border border-destructive/30 bg-destructive/10 p-2 text-destructive text-xs">
                    {error}
                </p>
            ) : null}
        </article>
    );
}
