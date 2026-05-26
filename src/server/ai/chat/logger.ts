export function createChatLogger(input: { query: string; sessionId?: string }) {
    const requestId = crypto.randomUUID().slice(0, 8);
    const startedAt = Date.now();

    return {
        info(stage: string, details: Record<string, unknown> = {}) {
            console.info(
                `[chat] ${JSON.stringify({
                    elapsedMs: Date.now() - startedAt,
                    query: input.query,
                    requestId,
                    sessionId: input.sessionId,
                    stage,
                    ...details,
                })}`
            );
        },
    };
}

export type ChatLogger = ReturnType<typeof createChatLogger>;
