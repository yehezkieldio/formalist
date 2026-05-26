import { NextResponse } from "next/server";

import { env } from "#/env";
import { requireAdmin } from "#/server/auth/require-admin";
import { createUploadedDocument } from "#/server/ingestion/documents";
import { assertUploadCanBeProcessed } from "#/server/ingestion/upload-buffer";
import {
    uploadMetadataSchema,
    validateUploadedFile,
} from "#/server/ingestion/upload-schema";

export async function POST(request: Request) {
    const unauthorized = await requireAdmin();

    if (unauthorized) {
        return unauthorized;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json(
            { error: "File is required." },
            { status: 400 }
        );
    }

    const metadata = uploadMetadataSchema.parse({
        sourceName: formData.get("sourceName") || undefined,
        storeOriginalFile: formData.get("storeOriginalFile") === "on",
        storePageImages: formData.get("storePageImages") === "on",
    });
    const validatedFile = validateUploadedFile({
        filename: file.name,
        maxUploadMb: env.MAX_UPLOAD_MB,
        mimeType: file.type,
        size: file.size,
    });

    assertUploadCanBeProcessed({
        deploymentMode: env.DEPLOYMENT_MODE,
        storeOriginalFile: metadata.storeOriginalFile,
    });

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await createUploadedDocument({
        bytes,
        extension: validatedFile.extension,
        filename: validatedFile.filename,
        mimeType: validatedFile.mimeType,
        settings: {
            storeOriginalFiles: metadata.storeOriginalFile,
            uploadRoot: env.UPLOAD_ROOT,
        },
        sourceName: metadata.sourceName,
        storePageImages: metadata.storePageImages,
    });

    return NextResponse.json({
        documentId: result.document.id,
        jobId: result.job.id,
    });
}
