import path from "node:path";

export interface StoragePathConfig {
    uploadRoot: string;
}

export function resolveUploadRoot(uploadRoot: string): string {
    return path.resolve(uploadRoot);
}

export function assertUploadRootIsPrivate(uploadRoot: string): void {
    const publicRoot = path.resolve(process.cwd(), "public");
    const resolvedRoot = resolveUploadRoot(uploadRoot);

    if (
        resolvedRoot === publicRoot ||
        resolvedRoot.startsWith(`${publicRoot}${path.sep}`)
    ) {
        throw new Error("UPLOAD_ROOT must not be inside the public web root.");
    }
}

export function resolveStoragePath(
    config: StoragePathConfig,
    ...segments: string[]
): string {
    const root = resolveUploadRoot(config.uploadRoot);
    assertUploadRootIsPrivate(root);

    if (
        segments.some(
            (segment) => segment.includes("..") || path.isAbsolute(segment)
        )
    ) {
        throw new Error(
            "Storage path segments must be relative and cannot traverse."
        );
    }

    const resolvedPath = path.resolve(root, ...segments);

    if (
        resolvedPath !== root &&
        !resolvedPath.startsWith(`${root}${path.sep}`)
    ) {
        throw new Error("Resolved storage path escapes UPLOAD_ROOT.");
    }

    return resolvedPath;
}

export function originalFilePath(
    config: StoragePathConfig,
    documentId: string,
    extension: string
): string {
    const normalizedExtension = extension.replace(/^\./u, "").toLowerCase();

    return resolveStoragePath(
        config,
        "original",
        `${documentId}.${normalizedExtension}`
    );
}

export function pageImagePath(
    config: StoragePathConfig,
    documentId: string,
    pageNumber: number
): string {
    return resolveStoragePath(
        config,
        "pages",
        documentId,
        `page-${pageNumber}.png`
    );
}

export function extractedArtifactPath(
    config: StoragePathConfig,
    documentId: string,
    filename = "raw.json"
): string {
    return resolveStoragePath(config, "extracted", documentId, filename);
}

export function debugArtifactPath(
    config: StoragePathConfig,
    documentId: string,
    filename: string
): string {
    return resolveStoragePath(config, "debug", documentId, filename);
}
