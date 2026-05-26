"use client";

import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "#/components/ui/button";

export function DocumentUploadForm() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [error, setError] = useState<string>();
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState<string>();

    const uploadDocument = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(undefined);
        setSuccess(undefined);
        setIsUploading(true);

        try {
            const response = await fetch("/api/upload", {
                body: new FormData(event.currentTarget),
                method: "POST",
            });
            const body = (await response.json().catch(() => ({}))) as {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(body.error ?? "Upload failed.");
            }

            formRef.current?.reset();
            setSuccess("Upload queued for parsing.");
            router.refresh();
        } catch (uploadError) {
            setError(
                uploadError instanceof Error
                    ? uploadError.message
                    : "Upload failed."
            );
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section className="border bg-card p-4">
            <form
                className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)_13rem_auto] lg:items-end"
                encType="multipart/form-data"
                onSubmit={uploadDocument}
                ref={formRef}
            >
                <div className="grid gap-2">
                    <label
                        className="font-mono text-[10px] text-muted-foreground uppercase"
                        htmlFor="file"
                    >
                        File
                    </label>
                    <input
                        accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        aria-label="Tariff document file"
                        className="min-h-10 border bg-background px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                        id="file"
                        name="file"
                        required
                        type="file"
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="font-mono text-[10px] text-muted-foreground uppercase"
                        htmlFor="sourceName"
                    >
                        Source name
                    </label>
                    <input
                        aria-label="Source name"
                        className="h-10 border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        id="sourceName"
                        name="sourceName"
                        placeholder="Pelita Air May pricelist"
                        type="text"
                    />
                </div>
                <div className="grid gap-2 lg:border-l lg:pl-4">
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        Storage
                    </span>
                    <input
                        name="storeOriginalFile"
                        type="hidden"
                        value="true"
                    />
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            aria-label="Store original file"
                            checked
                            className="size-4"
                            disabled
                            type="checkbox"
                        />
                        Store original file
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            aria-label="Store page images"
                            className="size-4"
                            name="storePageImages"
                            type="checkbox"
                        />
                        Store page images
                    </label>
                </div>
                <Button
                    className="h-10 font-mono text-xs"
                    disabled={isUploading}
                    type="submit"
                >
                    <UploadIcon aria-hidden="true" />
                    {isUploading ? "Uploading" : "Upload"}
                </Button>
            </form>
            {error ? (
                <p className="mt-3 border border-destructive/30 bg-destructive/10 p-2 text-destructive text-sm">
                    {error}
                </p>
            ) : null}
            {success ? (
                <p className="mt-3 border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-600 text-sm dark:text-emerald-400">
                    {success}
                </p>
            ) : null}
        </section>
    );
}
