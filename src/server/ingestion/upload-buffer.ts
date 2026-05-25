export function assertUploadCanBeProcessed(input: {
    deploymentMode: string;
    storeOriginalFile: boolean;
}) {
    if (
        !input.storeOriginalFile &&
        input.deploymentMode === "managed-fallback"
    ) {
        throw new Error(
            "Managed fallback uploads must enable original file storage unless a synchronous parser is configured."
        );
    }
}
