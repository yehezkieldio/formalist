"use client";

import { useState, useTransition } from "react";

import { Button } from "#/components/ui/button";
import type { AppSettings } from "#/server/settings/schema";

function Field({
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
            <span className="font-medium">{label}</span>
            <input
                aria-label={label}
                className="h-9 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => onChange(event.target.value)}
                type={type}
                value={value}
            />
        </label>
    );
}

export function ModelRetrievalSettingsForm({
    settings,
}: {
    settings: AppSettings;
}) {
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState({
        chatModel: settings.models.chatModel,
        embeddingModel: settings.models.embeddingModel,
        maxToolSteps: String(settings.models.maxToolSteps),
        temperature: String(settings.models.temperature),
        topK: String(settings.retrieval.topK),
    });

    const submit = () => {
        startTransition(async () => {
            await fetch("/api/settings", {
                body: JSON.stringify({
                    ...settings,
                    models: {
                        ...settings.models,
                        chatModel: form.chatModel,
                        embeddingModel: form.embeddingModel,
                        maxToolSteps: Number(form.maxToolSteps),
                        temperature: Number(form.temperature),
                    },
                    retrieval: {
                        ...settings.retrieval,
                        topK: Number(form.topK),
                    },
                }),
                headers: { "content-type": "application/json" },
                method: "PATCH",
            });
        });
    };

    return (
        <section className="rounded-lg border p-4">
            <h2 className="font-semibold">Models And Retrieval</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field
                    label="Chat model"
                    onChange={(value) => setForm({ ...form, chatModel: value })}
                    value={form.chatModel}
                />
                <Field
                    label="Embedding model"
                    onChange={(value) =>
                        setForm({ ...form, embeddingModel: value })
                    }
                    value={form.embeddingModel}
                />
                <Field
                    label="Temperature"
                    onChange={(value) =>
                        setForm({ ...form, temperature: value })
                    }
                    type="number"
                    value={form.temperature}
                />
                <Field
                    label="Max tool steps"
                    onChange={(value) =>
                        setForm({ ...form, maxToolSteps: value })
                    }
                    type="number"
                    value={form.maxToolSteps}
                />
                <Field
                    label="Retrieval topK"
                    onChange={(value) => setForm({ ...form, topK: value })}
                    type="number"
                    value={form.topK}
                />
            </div>
            <Button
                className="mt-4"
                disabled={isPending}
                onClick={submit}
                type="button"
            >
                Save model settings
            </Button>
        </section>
    );
}
