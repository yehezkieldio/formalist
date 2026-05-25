import { and, asc, eq, lt, lte, sql } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { ingestionJobs } from "#/server/db/schema";
import type { IngestionJobStatus } from "#/server/db/schema";

export interface EnqueueIngestionJobInput {
    availableAt?: Date;
    documentId: string;
    maxAttempts?: number;
    payload?: unknown;
    type: string;
}

export async function enqueueIngestionJob(input: EnqueueIngestionJobInput) {
    const [job] = await getDatabase()
        .insert(ingestionJobs)
        .values({
            availableAt: input.availableAt,
            documentId: input.documentId,
            maxAttempts: input.maxAttempts ?? 3,
            payload: input.payload,
            status: "queued",
            type: input.type,
        })
        .returning();

    return job;
}

export function claimNextIngestionJob(now = new Date()) {
    return getDatabase().transaction(async (transaction) => {
        const [job] = await transaction
            .select()
            .from(ingestionJobs)
            .where(
                and(
                    eq(ingestionJobs.status, "queued"),
                    lte(ingestionJobs.availableAt, now)
                )
            )
            .orderBy(
                asc(ingestionJobs.availableAt),
                asc(ingestionJobs.createdAt)
            )
            .limit(1)
            .for("update", { skipLocked: true });

        if (!job) {
            return;
        }

        const [claimedJob] = await transaction
            .update(ingestionJobs)
            .set({
                attempts: sql`${ingestionJobs.attempts} + 1`,
                startedAt: now,
                status: "running",
                updatedAt: now,
            })
            .where(eq(ingestionJobs.id, job.id))
            .returning();

        return claimedJob;
    });
}

export async function updateIngestionJobStatus(
    jobId: string,
    status: IngestionJobStatus,
    error?: string
) {
    const now = new Date();
    const completedAt =
        status === "completed" || status === "failed" ? now : undefined;
    const [job] = await getDatabase()
        .update(ingestionJobs)
        .set({
            completedAt,
            error,
            status,
            updatedAt: now,
        })
        .where(eq(ingestionJobs.id, jobId))
        .returning();

    return job;
}

export async function rescheduleIngestionJob(
    jobId: string,
    availableAt: Date,
    error?: string
) {
    const [job] = await getDatabase()
        .update(ingestionJobs)
        .set({
            availableAt,
            error,
            status: "queued",
            updatedAt: new Date(),
        })
        .where(eq(ingestionJobs.id, jobId))
        .returning();

    return job;
}

export async function recoverStaleRunningIngestionJobs(input: {
    availableAt?: Date;
    error?: string;
    staleBefore: Date;
}) {
    const now = new Date();
    const jobs = await getDatabase()
        .update(ingestionJobs)
        .set({
            availableAt: input.availableAt ?? now,
            error: input.error,
            status: "queued",
            updatedAt: now,
        })
        .where(
            and(
                eq(ingestionJobs.status, "running"),
                lt(ingestionJobs.startedAt, input.staleBefore)
            )
        )
        .returning({ id: ingestionJobs.id });

    return jobs.length;
}
