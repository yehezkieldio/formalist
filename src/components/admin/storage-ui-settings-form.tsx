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
            <span className="font-medium">{label}</span>
            <input
                aria-label={label}
                className="h-9 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
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
    const [form, setForm] = useState({
        defaultOriginAirport: settings.quote.defaultOriginAirport ?? "",
        defaultOriginCity: settings.quote.defaultOriginCity ?? "",
        showToolCallsByDefault: settings.ui.showToolCallsByDefault,
        storeDebugArtifacts: settings.storage.storeDebugArtifacts,
        storeOriginalFiles: settings.storage.storeOriginalFiles,
        storePageImages: settings.storage.storePageImages,
    });

    const submit = () => {
        startTransition(async () => {
            await fetch("/api/settings", {
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
        });
    };

    return (
        <section className="rounded-lg border p-4">
            <h2 className="font-semibold">Storage, UI, And Quote Defaults</h2>
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
                className="mt-4"
                disabled={isPending}
                onClick={submit}
                type="button"
            >
                Save storage settings
            </Button>
        </section>
    );
}
