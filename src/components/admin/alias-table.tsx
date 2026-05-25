"use client";

import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { AliasType } from "#/server/db/schema";

interface AliasRow {
    alias: string;
    canonicalValue: string;
    id: string;
    isAmbiguous: boolean;
    type: AliasType;
}

interface AliasTableProps {
    aliases: AliasRow[];
}

const aliasTypeOptions: AliasType[] = [
    "city",
    "airport",
    "airline",
    "route",
    "destination",
];

export function AliasTable({ aliases }: AliasTableProps) {
    const [filter, setFilter] = useState("");
    const [rows, setRows] = useState(aliases);
    const [draft, setDraft] = useState({
        alias: "",
        canonicalValue: "",
        isAmbiguous: false,
        type: "city" as AliasType,
    });

    const filteredRows = useMemo(
        () =>
            rows.filter((row) =>
                `${row.type} ${row.alias} ${row.canonicalValue}`
                    .toLowerCase()
                    .includes(filter.toLowerCase())
            ),
        [filter, rows]
    );

    async function refresh() {
        const response = await fetch("/api/aliases");
        const data = (await response.json()) as { aliases: AliasRow[] };
        setRows(data.aliases);
    }

    async function createAlias() {
        await fetch("/api/aliases", {
            body: JSON.stringify(draft),
            headers: { "content-type": "application/json" },
            method: "POST",
        });
        setDraft({
            alias: "",
            canonicalValue: "",
            isAmbiguous: false,
            type: "city",
        });
        await refresh();
    }

    async function updateAlias(row: AliasRow) {
        await fetch(`/api/aliases/${row.id}`, {
            body: JSON.stringify(row),
            headers: { "content-type": "application/json" },
            method: "PUT",
        });
        await refresh();
    }

    async function deleteAlias(row: AliasRow) {
        await fetch(`/api/aliases/${row.id}`, { method: "DELETE" });
        await refresh();
    }

    return (
        <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-end">
                <label className="grid gap-1 text-sm">
                    <span className="font-medium">Alias</span>
                    <input
                        aria-label="Alias"
                        className="h-9 rounded-md border bg-background px-3"
                        value={draft.alias}
                        onChange={(event) =>
                            setDraft({ ...draft, alias: event.target.value })
                        }
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-medium">Canonical</span>
                    <input
                        aria-label="Canonical value"
                        className="h-9 rounded-md border bg-background px-3"
                        value={draft.canonicalValue}
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                canonicalValue: event.target.value,
                            })
                        }
                    />
                </label>
                <label className="grid gap-1 text-sm">
                    <span className="font-medium">Type</span>
                    <select
                        aria-label="Alias type"
                        className="h-9 rounded-md border bg-background px-3"
                        value={draft.type}
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                type: event.target.value as AliasType,
                            })
                        }
                    >
                        {aliasTypeOptions.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex h-9 items-center gap-2 text-sm">
                    <input
                        aria-label="New alias is ambiguous"
                        type="checkbox"
                        checked={draft.isAmbiguous}
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                isAmbiguous: event.target.checked,
                            })
                        }
                    />
                    Ambiguous
                </label>
                <Button type="button" onClick={createAlias}>
                    <Plus />
                    Create
                </Button>
            </div>
            <div className="flex items-center gap-3">
                <input
                    aria-label="Search aliases"
                    className="h-9 w-full max-w-sm rounded-md border bg-background px-3"
                    placeholder="Search aliases"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                />
            </div>
            <div className="overflow-hidden rounded-lg border">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-muted text-left">
                        <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">Alias</th>
                            <th className="p-3">Canonical</th>
                            <th className="p-3">State</th>
                            <th className="w-24 p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row) => (
                            // eslint-disable-next-line no-use-before-define
                            <AliasEditableRow
                                key={row.id}
                                row={row}
                                onDelete={deleteAlias}
                                onSave={updateAlias}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AliasEditableRow({
    onDelete,
    onSave,
    row,
}: {
    onDelete: (row: AliasRow) => Promise<void>;
    onSave: (row: AliasRow) => Promise<void>;
    row: AliasRow;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(row);
    let stateContent = <Badge variant="outline">Exact</Badge>;

    if (editing) {
        stateContent = (
            <label className="flex items-center gap-2">
                <input
                    aria-label="Mark alias ambiguous"
                    type="checkbox"
                    checked={draft.isAmbiguous}
                    onChange={(event) =>
                        setDraft({
                            ...draft,
                            isAmbiguous: event.target.checked,
                        })
                    }
                />
                Ambiguous
            </label>
        );
    } else if (row.isAmbiguous) {
        stateContent = <Badge variant="secondary">Ambiguous</Badge>;
    }
    const actionIcon = editing ? <Save /> : <Edit3 />;

    return (
        <tr className="border-t">
            <td className="p-3">{row.type}</td>
            <td className="p-3">
                {editing ? (
                    <input
                        aria-label="Edit alias"
                        className="h-8 rounded-md border bg-background px-2"
                        value={draft.alias}
                        onChange={(event) =>
                            setDraft({ ...draft, alias: event.target.value })
                        }
                    />
                ) : (
                    row.alias
                )}
            </td>
            <td className="p-3">
                {editing ? (
                    <input
                        aria-label="Edit canonical value"
                        className="h-8 rounded-md border bg-background px-2"
                        value={draft.canonicalValue}
                        onChange={(event) =>
                            setDraft({
                                ...draft,
                                canonicalValue: event.target.value,
                            })
                        }
                    />
                ) : (
                    row.canonicalValue
                )}
            </td>
            <td className="p-3">{stateContent}</td>
            <td className="p-3">
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={editing ? "Save alias" : "Edit alias"}
                        onClick={async () => {
                            if (editing) {
                                await onSave(draft);
                            }
                            setEditing(!editing);
                        }}
                    >
                        {actionIcon}
                    </Button>
                    <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete alias"
                        onClick={() => onDelete(row)}
                    >
                        <Trash2 />
                    </Button>
                </div>
            </td>
        </tr>
    );
}
