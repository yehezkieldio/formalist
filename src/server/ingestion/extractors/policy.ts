import { setIngestionDocumentStatus } from "#/server/ingestion/status";
import type { QueueJob } from "#/server/queue/adapter";

export class ExtractionSetupRequiredError extends Error {
    constructor(message = "OPENROUTER_API_KEY is required for extraction.") {
        super(message);
        this.name = "ExtractionSetupRequiredError";
    }
}

export function isExtractionSetupRequired(error: unknown): boolean {
    return (
        error instanceof ExtractionSetupRequiredError ||
        (error instanceof Error && error.message.includes("OPENROUTER_API_KEY"))
    );
}

export async function markExtractionSetupRequired(job: QueueJob) {
    await setIngestionDocumentStatus({
        error: "LLM extraction setup required: OPENROUTER_API_KEY is not configured.",
        job,
        status: "needs_review",
    });
}
