import { and, asc, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";

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

export async function getMostRecentChatSession() {
    const [session] = await getDatabase()
        .select()
        .from(chatSessions)
        .where(isNull(chatSessions.deletedAt))
        .orderBy(desc(chatSessions.updatedAt))
        .limit(1);

    return session;
}

export async function getMostRecentEmptyChatSession() {
    const [session] = await getDatabase()
        .select()
        .from(chatSessions)
        .where(
            and(
                isNull(chatSessions.deletedAt),
                sql`not exists (
                    select 1
                    from ${chatMessages}
                    where ${chatMessages.sessionId} = ${chatSessions.id}
                )`
            )
        )
        .orderBy(desc(chatSessions.updatedAt))
        .limit(1);

    return session;
}

export function searchChatSessions(query: string, limit = 20) {
    return getDatabase()
        .select()
        .from(chatSessions)
        .where(ilike(chatSessions.title, `%${query}%`))
        .orderBy(desc(chatSessions.updatedAt))
        .limit(limit);
}

export async function getChatSession(sessionId: string) {
    const [session] = await getDatabase()
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, sessionId))
        .limit(1);

    return session;
}

export async function renameChatSession(sessionId: string, title: string) {
    const [session] = await getDatabase()
        .update(chatSessions)
        .set({ title, updatedAt: new Date() })
        .where(eq(chatSessions.id, sessionId))
        .returning();

    return session;
}

export async function softDeleteChatSession(sessionId: string) {
    const [session] = await getDatabase()
        .update(chatSessions)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(chatSessions.id, sessionId))
        .returning();

    return session;
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

export function listChatMessages(sessionId: string) {
    return getDatabase()
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt));
}

export function listChatToolCalls(sessionId: string) {
    return getDatabase()
        .select()
        .from(chatToolCalls)
        .where(eq(chatToolCalls.sessionId, sessionId))
        .orderBy(asc(chatToolCalls.startedAt));
}

export function listChatSources(messageIds: string[]) {
    if (messageIds.length === 0) {
        return [];
    }

    return getDatabase()
        .select()
        .from(chatSources)
        .where(inArray(chatSources.messageId, messageIds))
        .orderBy(asc(chatSources.createdAt));
}

export function listAnswerVerifications(messageIds: string[]) {
    if (messageIds.length === 0) {
        return [];
    }

    return getDatabase()
        .select()
        .from(answerVerifications)
        .where(inArray(answerVerifications.messageId, messageIds))
        .orderBy(desc(answerVerifications.createdAt));
}

export async function createChatToolCall(
    input: typeof chatToolCalls.$inferInsert
) {
    const [toolCall] = await getDatabase()
        .insert(chatToolCalls)
        .values(input)
        .returning();

    return toolCall;
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

export function attachUnlinkedChatToolCallsToMessage(
    sessionId: string,
    messageId: string
) {
    return getDatabase()
        .update(chatToolCalls)
        .set({ messageId })
        .where(
            and(
                eq(chatToolCalls.sessionId, sessionId),
                isNull(chatToolCalls.messageId)
            )
        )
        .returning();
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
