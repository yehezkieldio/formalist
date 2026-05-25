import { desc, eq, isNull } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import {
    answerVerifications,
    chatMessages,
    chatSessions,
    chatSources,
    chatToolCalls,
} from "#/server/db/schema";
import type {
    AnswerMode,
    ConfidenceState,
    ToolCallState,
} from "#/server/db/schema";

export async function createChatSession(title?: string) {
    const [session] = await getDatabase()
        .insert(chatSessions)
        .values({ title })
        .returning();

    return session;
}

export function listChatSessions(limit = 50) {
    return getDatabase()
        .select()
        .from(chatSessions)
        .where(isNull(chatSessions.deletedAt))
        .orderBy(desc(chatSessions.updatedAt))
        .limit(limit);
}

export async function createChatMessage(input: {
    content: string;
    metadata?: unknown;
    parts?: unknown;
    role: string;
    sessionId: string;
}) {
    const [message] = await getDatabase()
        .insert(chatMessages)
        .values(input)
        .returning();

    return message;
}

export async function updateChatToolCallState(
    toolCallId: string,
    state: ToolCallState,
    output?: unknown,
    error?: string
) {
    const [toolCall] = await getDatabase()
        .update(chatToolCalls)
        .set({
            completedAt:
                state === "success" || state === "error"
                    ? new Date()
                    : undefined,
            error,
            output,
            state,
        })
        .where(eq(chatToolCalls.id, toolCallId))
        .returning();

    return toolCall;
}

export async function attachChatSource(input: typeof chatSources.$inferInsert) {
    const [source] = await getDatabase()
        .insert(chatSources)
        .values(input)
        .returning();

    return source;
}

export async function createAnswerVerification(input: {
    checks: unknown;
    confidenceState: ConfidenceState;
    messageId: string;
    mode: AnswerMode;
    sessionId: string;
    warnings?: unknown;
}) {
    const [verification] = await getDatabase()
        .insert(answerVerifications)
        .values(input)
        .returning();

    return verification;
}
