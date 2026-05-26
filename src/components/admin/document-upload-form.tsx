import { UploadIcon } from "lucide-react";

import { Button } from "#/components/ui/button";

export function DocumentUploadForm() {
    return (
        <section className="border bg-card p-4">
            <form
                action="/api/upload"
                className="grid gap-4"
                encType="multipart/form-data"
                method="post"
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
                <div className="grid gap-2 border-t pt-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            aria-label="Store original file"
                            className="size-4"
                            name="storeOriginalFile"
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
                <Button className="h-10 font-mono text-xs" type="submit">
                    <UploadIcon aria-hidden="true" />
                    Upload and enqueue
                </Button>
            </form>
        </section>
    );
}
