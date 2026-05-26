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

export function ModelRetrievalSettingsForm({
    settings,
}: {
    settings: AppSettings;
}) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<string | null>(null);
    const [form, setForm] = useState({
        chatModel: settings.models.chatModel,
        embeddingModel: settings.models.embeddingModel,
        maxToolSteps: String(settings.models.maxToolSteps),
        temperature: String(settings.models.temperature),
        topK: String(settings.retrieval.topK),
    });

    const submit = () => {
        setStatus(null);
        startTransition(async () => {
            const response = await fetch("/api/settings", {
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

            setStatus(
                response.ok
                    ? "Model and retrieval settings saved."
                    : "Could not save model settings."
            );
        });
    };

    return (
        <section className="border bg-card p-4">
            <div className="grid gap-1">
                <h2 className="font-semibold">Models and retrieval</h2>
                <p className="text-muted-foreground text-xs leading-5">
                    These values control chat model selection and the number of
                    records retrieved for RAG.
                </p>
            </div>
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
                className="mt-4 font-mono text-xs"
                disabled={isPending}
                onClick={submit}
                type="button"
            >
                {isPending ? "Saving..." : "Save model settings"}
            </Button>
            {status ? (
                <p className="mt-3 border bg-muted/20 p-2 text-muted-foreground text-xs">
                    {status}
                </p>
            ) : null}
        </section>
    );
}
