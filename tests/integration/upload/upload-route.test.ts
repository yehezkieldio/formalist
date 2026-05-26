import { describe, expect, it } from "vitest";

import { assertUploadCanBeProcessed } from "#/server/ingestion/upload-buffer";
import {
    uploadMetadataSchema,
    validateUploadedFile,
} from "#/server/ingestion/upload-schema";

describe("upload validation", () => {
    it("accepts supported PDF, DOCX, and TXT files", () => {
        expect(
            validateUploadedFile({
                filename: "tariff.pdf",
                maxUploadMb: 10,
                mimeType: "application/pdf",
                size: 1024,
            })
        ).toMatchObject({ extension: "pdf" });
        expect(
            validateUploadedFile({
                filename: "tariff.docx",
                maxUploadMb: 10,
                mimeType:
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                size: 1024,
            })
        ).toMatchObject({ extension: "docx" });
        expect(
            validateUploadedFile({
                filename: "tariff.txt",
                maxUploadMb: 10,
                mimeType: "text/plain",
                size: 1024,
            })
        ).toMatchObject({ extension: "txt" });
    });

    it("rejects unsupported file types and oversized uploads", () => {
        expect(() =>
            validateUploadedFile({
                filename: "tariff.csv",
                maxUploadMb: 10,
                mimeType: "text/csv",
                size: 1024,
            })
        ).toThrow();
        expect(() =>
            validateUploadedFile({
                filename: "tariff.pdf",
                maxUploadMb: 1,
                mimeType: "application/pdf",
                size: 2 * 1024 * 1024,
            })
        ).toThrow("Upload exceeds 1 MB.");
    });

    it("parses artifact flags from form metadata", () => {
        expect(
            uploadMetadataSchema.parse({
                sourceName: "Pelita",
                storeOriginalFile: "true",
                storePageImages: "false",
            })
        ).toEqual({
            sourceName: "Pelita",
            storeOriginalFile: true,
            storePageImages: false,
        });
    });

    it("requires original file storage for managed fallback async uploads", () => {
        expect(() =>
            assertUploadCanBeProcessed({
                deploymentMode: "managed-fallback",
                storeOriginalFile: false,
            })
        ).toThrow("Managed fallback uploads");
    });
});
