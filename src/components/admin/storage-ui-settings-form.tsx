"use client";

import { useState, useTransition } from "react";

import { Button } from "#/components/ui/button";
import type { AppSettings } from "#/server/settings/schema";

function TextField({
    label,
    onChange,
    value,
}: {
    label: string;
    onChange: (value: string) => void;
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
                value={value}
            />
        </label>
    );
}

function Toggle({
    checked,
    label,
    onChange,
}: {
    checked: boolean;
    label: string;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 border bg-muted/10 p-3 text-sm">
            <input
                aria-label={label}
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                type="checkbox"
            />
            <span>{label}</span>
        </label>
    );
}

export function StorageUiSettingsForm({ settings }: { settings: AppSettings }) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<string | null>(null);
    const [form, setForm] = useState({
        defaultOriginAirport: settings.quote.defaultOriginAirport ?? "",
        defaultOriginCity: settings.quote.defaultOriginCity ?? "",
        showToolCallsByDefault: settings.ui.showToolCallsByDefault,
        storeDebugArtifacts: settings.storage.storeDebugArtifacts,
        storeOriginalFiles: settings.storage.storeOriginalFiles,
        storePageImages: settings.storage.storePageImages,
    });

    const submit = () => {
        setStatus(null);
        startTransition(async () => {
            const response = await fetch("/api/settings", {
                body: JSON.stringify({
                    ...settings,
                    quote: {
                        ...settings.quote,
                        defaultOriginAirport: form.defaultOriginAirport,
                        defaultOriginCity: form.defaultOriginCity,
                    },
                    storage: {
                        storeDebugArtifacts: form.storeDebugArtifacts,
                        storeOriginalFiles: form.storeOriginalFiles,
                        storePageImages: form.storePageImages,
                    },
                    ui: {
                        ...settings.ui,
                        showToolCallsByDefault: form.showToolCallsByDefault,
                    },
                }),
                headers: { "content-type": "application/json" },
                method: "PATCH",
            });

            setStatus(
                response.ok
                    ? "Storage, UI, and quote defaults saved."
                    : "Could not save storage settings."
            );
        });
    };

    return (
        <section className="border bg-card p-4">
            <div className="grid gap-1">
                <h2 className="font-semibold">
                    Storage, UI, and quote defaults
                </h2>
                <p className="text-muted-foreground text-xs leading-5">
                    Keep these defaults aligned with the deployment storage and
                    origin airport used by most quotes.
                </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TextField
                    label="Default origin city"
                    onChange={(value) =>
                        setForm({ ...form, defaultOriginCity: value })
                    }
                    value={form.defaultOriginCity}
                />
                <TextField
                    label="Default origin airport"
                    onChange={(value) =>
                        setForm({ ...form, defaultOriginAirport: value })
                    }
                    value={form.defaultOriginAirport}
                />
                <Toggle
                    checked={form.storeOriginalFiles}
                    label="Store original files"
                    onChange={(value) =>
                        setForm({ ...form, storeOriginalFiles: value })
                    }
                />
                <Toggle
                    checked={form.storePageImages}
                    label="Store page images"
                    onChange={(value) =>
                        setForm({ ...form, storePageImages: value })
                    }
                />
                <Toggle
                    checked={form.storeDebugArtifacts}
                    label="Store debug artifacts"
                    onChange={(value) =>
                        setForm({ ...form, storeDebugArtifacts: value })
                    }
                />
                <Toggle
                    checked={form.showToolCallsByDefault}
                    label="Show tool calls by default"
                    onChange={(value) =>
                        setForm({ ...form, showToolCallsByDefault: value })
                    }
                />
            </div>
            <Button
                className="mt-4 font-mono text-xs"
                disabled={isPending}
                onClick={submit}
                type="button"
            >
                {isPending ? "Saving..." : "Save storage settings"}
            </Button>
            {status ? (
                <p className="mt-3 border bg-muted/20 p-2 text-muted-foreground text-xs">
                    {status}
                </p>
            ) : null}
        </section>
    );
}
