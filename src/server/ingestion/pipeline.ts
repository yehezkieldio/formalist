import type { QueueJob } from "#/server/queue/adapter";

import { setIngestionDocumentStatus } from "./status";

export async function dispatchIngestionJob(job: QueueJob) {
    if (job.type === "parse-document") {
        await setIngestionDocumentStatus({ job, status: "parsing" });
        return;
    }

    if (job.type === "chunk-document") {
        await setIngestionDocumentStatus({ job, status: "chunked" });
        return;
    }

    if (job.type === "extract-structured-data") {
        await setIngestionDocumentStatus({ job, status: "extracted" });
        return;
    }

    if (job.type === "validate-extraction") {
        await setIngestionDocumentStatus({ job, status: "needs_review" });
        return;
    }

    if (job.type === "embed-sources") {
        return;
    }

    const exhaustiveCheck: never = job.type;
    throw new Error(`Unsupported ingestion job type: ${exhaustiveCheck}`);
}
