import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    debugArtifactPath,
    extractedArtifactPath,
    originalFilePath,
    pageImagePath,
    resolveStoragePath,
} from "#/server/storage/paths";

describe("storage paths", () => {
    const uploadRoot = path.join(process.cwd(), ".tmp", "uploads");

    it("resolves paths inside upload root", () => {
        expect(resolveStoragePath({ uploadRoot }, "original", "doc.pdf")).toBe(
            path.join(uploadRoot, "original", "doc.pdf")
        );
    });

    it("rejects traversal and absolute path segments", () => {
        expect(() =>
            resolveStoragePath({ uploadRoot }, "..", "secret")
        ).toThrow("traverse");
        expect(() => resolveStoragePath({ uploadRoot }, "/tmp/secret")).toThrow(
            "relative"
        );
    });

    it("rejects public-root storage", () => {
        expect(() =>
            resolveStoragePath(
                { uploadRoot: path.join(process.cwd(), "public", "uploads") },
                "x"
            )
        ).toThrow("public web root");
    });

    it("builds original, page, extracted, and debug artifact paths", () => {
        expect(originalFilePath({ uploadRoot }, "doc-1", ".PDF")).toMatch(
            /original\/doc-1\.pdf$/u
        );
        expect(pageImagePath({ uploadRoot }, "doc-1", 2)).toMatch(
            /pages\/doc-1\/page-2\.png$/u
        );
        expect(extractedArtifactPath({ uploadRoot }, "doc-1")).toMatch(
            /extracted\/doc-1\/raw\.json$/u
        );
        expect(
            debugArtifactPath({ uploadRoot }, "doc-1", "trace.json")
        ).toMatch(/debug\/doc-1\/trace\.json$/u);
    });
});
