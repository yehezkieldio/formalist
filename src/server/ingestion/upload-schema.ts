import { z } from "zod";

const allowedFileTypes = ["pdf", "docx", "txt"] as const;
const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
] as const;

const checkboxBooleanSchema = z
    .union([z.boolean(), z.enum(["true", "false", "on"])])
    .default(false)
    .transform((value) => value === true || value === "true" || value === "on");

export const uploadMetadataSchema = z.object({
    sourceName: z.string().trim().min(1).optional(),
    storeOriginalFile: checkboxBooleanSchema,
    storePageImages: checkboxBooleanSchema,
});

export const uploadedFileSchema = z.object({
    extension: z.enum(allowedFileTypes),
    filename: z.string().min(1),
    mimeType: z.enum(allowedMimeTypes),
    size: z.number().int().positive(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;
export type UploadedFileInput = z.infer<typeof uploadedFileSchema>;

export function extensionFromFilename(filename: string) {
    const extension = filename.split(".").at(-1)?.toLowerCase();

    return extension;
}

export function validateUploadedFile(input: {
    filename: string;
    maxUploadMb: number;
    mimeType: string;
    size: number;
}): UploadedFileInput {
    const maxBytes = input.maxUploadMb * 1024 * 1024;
    const extension = extensionFromFilename(input.filename);

    if (input.size > maxBytes) {
        throw new Error(`Upload exceeds ${input.maxUploadMb} MB.`);
    }

    return uploadedFileSchema.parse({
        extension,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
    });
}
