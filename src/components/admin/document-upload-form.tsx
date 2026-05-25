import { UploadIcon } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card";

export function DocumentUploadForm() {
    return (
        <Card>
            <CardHeader>
                <UploadIcon aria-hidden="true" />
                <CardTitle>Upload document</CardTitle>
                <CardDescription>
                    Upload PDF, DOCX, or TXT tariff files for ingestion and
                    review.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    action="/api/upload"
                    className="grid gap-4"
                    encType="multipart/form-data"
                    method="post"
                >
                    <div className="grid gap-2">
                        <label className="font-medium text-sm" htmlFor="file">
                            File
                        </label>
                        <input
                            accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            aria-label="Tariff document file"
                            className="rounded-md border bg-background px-3 py-2 text-sm"
                            id="file"
                            name="file"
                            required
                            type="file"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label
                            className="font-medium text-sm"
                            htmlFor="sourceName"
                        >
                            Source name
                        </label>
                        <input
                            aria-label="Source name"
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            id="sourceName"
                            name="sourceName"
                            placeholder="Pelita Air May pricelist"
                            type="text"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            aria-label="Store original file"
                            name="storeOriginalFile"
                            type="checkbox"
                        />
                        Store original file
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            aria-label="Store page images"
                            name="storePageImages"
                            type="checkbox"
                        />
                        Store page images
                    </label>
                    <Button type="submit">Upload and enqueue</Button>
                </form>
            </CardContent>
        </Card>
    );
}
