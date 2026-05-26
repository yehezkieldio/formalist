"use client";

import { DatabaseIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminEmptyState } from "./admin-primitives";
import { SourceSnippetPreview } from "./source-snippet-preview";

interface SemanticChunk {
    content: string;
    documentId: string;
    id: string;
    pageNumber: number | null;
    status: string;
}

interface TableChunk {
    documentId: string;
    id: string;
    pageNumber: number | null;
    rowText: string;
    status: string;
}

export function ChunkTable({
    chunks,
    tableChunks,
}: {
    chunks: SemanticChunk[];
    tableChunks: TableChunk[];
}) {
    const [query, setQuery] = useState("");
    const [kind, setKind] = useState<"all" | "semantic" | "table">("all");
    const records = useMemo(
        () => [
            ...chunks.map((chunk) => ({
                documentId: chunk.documentId,
                id: chunk.id,
                kind: "semantic" as const,
                pageNumber: chunk.pageNumber,
                snippet: chunk.content,
                sourceType: `document_chunk:${chunk.status}`,
            })),
            ...tableChunks.map((chunk) => ({
                documentId: chunk.documentId,
                id: chunk.id,
                kind: "table" as const,
                pageNumber: chunk.pageNumber,
                snippet: chunk.rowText,
                sourceType: `table_chunk:${chunk.status}`,
            })),
        ],
        [chunks, tableChunks]
    );
    const filteredRecords = useMemo(
        () =>
            records.filter((record) => {
                const matchesKind = kind === "all" || record.kind === kind;
                const matchesQuery =
                    query.trim().length === 0 ||
                    `${record.sourceType} ${record.snippet}`
                        .toLowerCase()
                        .includes(query.toLowerCase());

                return matchesKind && matchesQuery;
            }),
        [kind, query, records]
    );

    if (records.length === 0) {
        return (
            <AdminEmptyState
                description="Chunks are created by the ingestion pipeline after document parsing."
                icon={DatabaseIcon}
                title="No chunks indexed"
            />
        );
    }

    return (
        <section className="grid gap-4">
            <div className="grid gap-3 border bg-muted/10 p-3 md:grid-cols-[minmax(0,1fr)_12rem]">
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Search evidence
                    </span>
                    <input
                        aria-label="Search chunks"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="raw table text, city, airline, fee note"
                        value={query}
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Chunk type
                    </span>
                    <select
                        aria-label="Filter chunk type"
                        className="h-9 border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onChange={(event) =>
                            setKind(event.target.value as typeof kind)
                        }
                        value={kind}
                    >
                        <option value="all">All chunks</option>
                        <option value="semantic">Semantic</option>
                        <option value="table">Table rows</option>
                    </select>
                </label>
            </div>
            <div className="grid gap-3">
                {filteredRecords.map((record) => (
                    <SourceSnippetPreview
                        documentId={record.documentId}
                        key={`${record.kind}:${record.id}`}
                        pageNumber={record.pageNumber}
                        snippet={record.snippet}
                        sourceType={record.sourceType}
                    />
                ))}
            </div>
        </section>
    );
}
