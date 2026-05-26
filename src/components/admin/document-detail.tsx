import type { LucideIcon } from "lucide-react";
/* eslint-disable no-use-before-define */
import {
    ArrowLeftIcon,
    BoxesIcon,
    DatabaseIcon,
    FileTextIcon,
    ListChecksIcon,
    ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";

import {
    AdminMetricStrip,
    AdminPageHeader,
    ReviewStatusBadge,
} from "#/components/admin/admin-primitives";
import { DocumentIssuePanel } from "#/components/admin/document-issue-panel";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type {
    IssueSeverity,
    IssueStatus,
    ReviewStatus,
} from "#/server/db/schema";

import { SourceSnippetPreview } from "./source-snippet-preview";

interface DetailRecord {
    id: string;
    status: ReviewStatus;
}

interface DocumentIssue {
    id: string;
    issueType: string;
    message: string;
    severity: IssueSeverity;
    sourceId: string | null;
    sourceType: string | null;
    status: IssueStatus;
}

interface DocumentDetailPayload {
    chunks: {
        content: string;
        id: string;
        pageNumber: number | null;
        status: string;
    }[];
    document: {
        effectiveDate: string | null;
        filename: string;
        id: string;
        ingestionError: string | null;
        originalPath: string | null;
        sourceName: string | null;
        status: string;
        storeOriginalFile: boolean;
        storePageImages: boolean;
        validFrom: string | null;
        validUntil: string | null;
    };
    facts: (DetailRecord & {
        destinationCity: string | null;
        factType: string;
        rawEvidence: string | null;
        valueText: string | null;
    })[];
    feeRules: (DetailRecord & {
        adminFeePerSmu: number | null;
        airline: string | null;
        warehouseFeePerKg: number | null;
    })[];
    issues: DocumentIssue[];
    tableChunks: {
        id: string;
        pageNumber: number | null;
        rowText: string;
        status: string;
    }[];
    tariffRows: (DetailRecord & {
        airline: string | null;
        destinationCity: string | null;
        destinationCode: string | null;
        rawRowText: string | null;
        smuPricePerKg: number | null;
    })[];
}

export function DocumentDetail({ detail }: { detail: DocumentDetailPayload }) {
    const { document } = detail;
    const records = [...detail.tariffRows, ...detail.facts, ...detail.feeRules];
    const openIssues = detail.issues.filter(
        (issue) => issue.status === "open"
    ).length;
    const activeRecords = records.filter(
        (record) => record.status === "active"
    ).length;
    const reviewBacklog = records.length - activeRecords;

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                actions={
                    <>
                        <Button asChild size="sm" variant="outline">
                            <Link href="/admin/documents">
                                <ArrowLeftIcon aria-hidden="true" />
                                Documents
                            </Link>
                        </Button>
                        <ReviewStatusBadge status={document.status} />
                    </>
                }
                description={
                    document.sourceName ??
                    "Review ingestion output, validation issues, extracted records, and source evidence."
                }
                eyebrow="Document"
                title={document.filename}
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Records", value: records.length },
                    {
                        label: "Active",
                        tone: "success",
                        value: activeRecords,
                    },
                    {
                        label: "Needs attention",
                        tone: reviewBacklog > 0 ? "warning" : "default",
                        value: reviewBacklog,
                    },
                    {
                        label: "Open issues",
                        tone: openIssues > 0 ? "danger" : "default",
                        value: openIssues,
                    },
                    {
                        label: "Evidence",
                        value: detail.chunks.length + detail.tableChunks.length,
                    },
                ]}
            />
            <DocumentPosture detail={detail} />
            {document.ingestionError ? (
                <div className="border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                    {document.ingestionError}
                </div>
            ) : null}
            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <DocumentIssuePanel issues={detail.issues} />
                <RecordOverview
                    facts={detail.facts}
                    feeRules={detail.feeRules}
                    tariffRows={detail.tariffRows}
                />
            </section>
            <EvidenceSummary
                chunks={detail.chunks}
                tableChunks={detail.tableChunks}
            />
        </div>
    );
}

function DocumentPosture({ detail }: { detail: DocumentDetailPayload }) {
    const { document } = detail;
    const fileFacts = [
        ["Source", document.sourceName ?? "No source name"],
        ["Effective", document.effectiveDate ?? "Unknown"],
        [
            "Valid",
            `${document.validFrom ?? "Unknown"} to ${
                document.validUntil ?? "Unknown"
            }`,
        ],
        ["Original", document.storeOriginalFile ? "Stored" : "Not stored"],
        ["Pages", document.storePageImages ? "Images stored" : "Text only"],
    ] as const;

    return (
        <section className="grid gap-3 border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <FileTextIcon aria-hidden="true" className="size-4" />
                    <h2 className="font-semibold text-sm">Document posture</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                        {detail.tariffRows.length} tariff rows
                    </Badge>
                    <Badge variant="outline">{detail.facts.length} facts</Badge>
                    <Badge variant="outline">
                        {detail.feeRules.length} fee rules
                    </Badge>
                </div>
            </div>
            <dl className="grid gap-3 md:grid-cols-5">
                {fileFacts.map(([label, value]) => (
                    <div className="min-w-0" key={label}>
                        <dt className="font-mono text-[10px] text-muted-foreground uppercase">
                            {label}
                        </dt>
                        <dd className="mt-1 truncate text-sm" title={value}>
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
            {document.originalPath ? (
                <p className="break-all border bg-muted/20 p-2 font-mono text-muted-foreground text-[10px]">
                    {document.originalPath}
                </p>
            ) : null}
        </section>
    );
}

function RecordOverview({
    facts,
    feeRules,
    tariffRows,
}: {
    facts: {
        destinationCity: string | null;
        factType: string;
        id: string;
        rawEvidence: string | null;
        status: string;
        valueText: string | null;
    }[];
    feeRules: {
        adminFeePerSmu: number | null;
        airline: string | null;
        id: string;
        status: string;
        warehouseFeePerKg: number | null;
    }[];
    tariffRows: {
        airline: string | null;
        destinationCity: string | null;
        destinationCode: string | null;
        id: string;
        rawRowText: string | null;
        smuPricePerKg: number | null;
        status: string;
    }[];
}) {
    return (
        <section className="grid gap-3">
            <div>
                <h2 className="font-semibold text-sm">Extracted records</h2>
                <p className="mt-1 text-muted-foreground text-xs">
                    Latest extracted rows grouped by what chat can use.
                </p>
            </div>
            <RecordLane
                icon={ListChecksIcon}
                records={tariffRows.slice(0, 5).map((row) => ({
                    id: row.id,
                    meta: `${row.destinationCode ?? "NO CODE"} · ${
                        row.smuPricePerKg === null
                            ? "N/A"
                            : `Rp ${row.smuPricePerKg.toLocaleString("id-ID")}`
                    }`,
                    snippet: row.rawRowText,
                    status: row.status,
                    title: `${row.airline ?? "Unknown"} to ${
                        row.destinationCity ?? "Unknown"
                    }`,
                }))}
                title="Tariff rows"
            />
            <RecordLane
                icon={ShieldCheckIcon}
                records={facts.slice(0, 5).map((fact) => ({
                    id: fact.id,
                    meta: fact.valueText ?? "No value",
                    snippet: fact.rawEvidence,
                    status: fact.status,
                    title: `${fact.factType} · ${
                        fact.destinationCity ?? "No destination"
                    }`,
                }))}
                title="Facts"
            />
            <RecordLane
                icon={BoxesIcon}
                records={feeRules.slice(0, 5).map((rule) => ({
                    id: rule.id,
                    meta: `Admin ${rule.adminFeePerSmu ?? "N/A"} · WH ${
                        rule.warehouseFeePerKg ?? "N/A"
                    }`,
                    snippet: null,
                    status: rule.status,
                    title: rule.airline ?? "Document default fees",
                }))}
                title="Fee rules"
            />
        </section>
    );
}

function RecordLane({
    icon: Icon,
    records,
    title,
}: {
    icon: LucideIcon;
    records: {
        id: string;
        meta: string;
        snippet: string | null;
        status: string;
        title: string;
    }[];
    title: string;
}) {
    return (
        <section className="border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="size-4" />
                    <h3 className="font-semibold text-sm">{title}</h3>
                </div>
                <Badge variant="outline">{records.length}</Badge>
            </div>
            <div className="mt-3 grid gap-2">
                {records.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                        Nothing extracted.
                    </p>
                ) : (
                    records.map((record) => (
                        <article
                            className="grid gap-2 border bg-muted/10 p-2"
                            key={record.id}
                        >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p
                                        className="truncate font-medium text-xs"
                                        title={record.title}
                                    >
                                        {record.title}
                                    </p>
                                    <p className="mt-1 truncate font-mono text-muted-foreground text-[10px]">
                                        {record.meta}
                                    </p>
                                </div>
                                <ReviewStatusBadge status={record.status} />
                            </div>
                            {record.snippet ? (
                                <p className="line-clamp-2 text-muted-foreground text-xs leading-5">
                                    {record.snippet}
                                </p>
                            ) : null}
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}

function EvidenceSummary({
    chunks,
    tableChunks,
}: {
    chunks: {
        content: string;
        id: string;
        pageNumber: number | null;
        status: string;
    }[];
    tableChunks: {
        id: string;
        pageNumber: number | null;
        rowText: string;
        status: string;
    }[];
}) {
    const samples = [
        ...tableChunks.slice(0, 4).map((chunk) => ({
            id: chunk.id,
            pageNumber: chunk.pageNumber,
            snippet: chunk.rowText,
            sourceType: `table_chunk:${chunk.status}`,
        })),
        ...chunks.slice(0, 4).map((chunk) => ({
            id: chunk.id,
            pageNumber: chunk.pageNumber,
            snippet: chunk.content,
            sourceType: `document_chunk:${chunk.status}`,
        })),
    ].slice(0, 6);

    return (
        <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <DatabaseIcon aria-hidden="true" className="size-4" />
                    <h2 className="font-semibold text-sm">Evidence samples</h2>
                </div>
                <Badge variant="outline">
                    {chunks.length + tableChunks.length} chunks
                </Badge>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
                {samples.length === 0 ? (
                    <div className="border bg-muted/10 p-4 text-muted-foreground text-xs">
                        No evidence chunks were produced.
                    </div>
                ) : (
                    samples.map((sample) => (
                        <SourceSnippetPreview
                            key={sample.id}
                            pageNumber={sample.pageNumber}
                            snippet={sample.snippet}
                            sourceType={sample.sourceType}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
