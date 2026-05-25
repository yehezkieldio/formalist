export const ingestionJobTypes = [
    "parse-document",
    "chunk-document",
    "extract-structured-data",
    "validate-extraction",
    "embed-sources",
] as const;

export type IngestionJobType = (typeof ingestionJobTypes)[number];

export interface IngestionQueuePayload {
    documentId: string;
    source?: string;
    [key: string]: unknown;
}

export interface QueueJob {
    attempts: number;
    documentId: string;
    id: string;
    maxAttempts: number;
    payload: IngestionQueuePayload;
    type: IngestionJobType;
}

export interface QueueWorkerContext {
    signal?: AbortSignal;
}

export type QueueJobHandler = (
    job: QueueJob,
    context: QueueWorkerContext
) => Promise<void>;

export interface EnqueueQueueJobInput {
    availableAt?: Date;
    documentId: string;
    maxAttempts?: number;
    payload?: Partial<IngestionQueuePayload>;
    type: IngestionJobType;
}

export interface RetryQueueJobInput {
    delayMs: number;
    error: Error;
    job: QueueJob;
}

export interface RecoverStaleQueueJobsInput {
    availableAt?: Date;
    error?: string;
    staleBefore: Date;
}

export interface QueueAdapterWarning {
    code: string;
    message: string;
}

export interface QueueWorkerHandle {
    close: () => Promise<void>;
}

export interface QueueAdapter {
    claim: () => Promise<QueueJob | undefined>;
    close?: () => Promise<void>;
    complete: (job: QueueJob) => Promise<void>;
    enqueue: (input: EnqueueQueueJobInput) => Promise<QueueJob>;
    fail: (job: QueueJob, error: Error) => Promise<void>;
    name: string;
    recoverStale?: (input: RecoverStaleQueueJobsInput) => Promise<number>;
    retry: (input: RetryQueueJobInput) => Promise<void>;
    startWorker?: (
        handler: QueueJobHandler,
        context?: QueueWorkerContext
    ) => Promise<QueueWorkerHandle>;
    warnings: QueueAdapterWarning[];
}

export class QueueAdapterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QueueAdapterError";
    }
}

export function isIngestionJobType(value: string): value is IngestionJobType {
    return ingestionJobTypes.includes(value as IngestionJobType);
}

export function normalizeQueuePayload(
    documentId: string,
    payload?: Partial<IngestionQueuePayload>
): IngestionQueuePayload {
    return {
        ...payload,
        documentId,
    };
}

export function toQueueJob(input: {
    attempts?: number | null;
    documentId: string;
    id: string;
    maxAttempts?: number | null;
    payload?: unknown;
    type: string;
}): QueueJob {
    if (!isIngestionJobType(input.type)) {
        throw new QueueAdapterError(
            `Unsupported ingestion job type: ${input.type}`
        );
    }

    const payload =
        input.payload && typeof input.payload === "object"
            ? (input.payload as Partial<IngestionQueuePayload>)
            : undefined;

    return {
        attempts: input.attempts ?? 0,
        documentId: input.documentId,
        id: input.id,
        maxAttempts: input.maxAttempts ?? 3,
        payload: normalizeQueuePayload(input.documentId, payload),
        type: input.type,
    };
}
