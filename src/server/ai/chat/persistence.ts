import type { UIMessage } from "ai";

import { verifyAnswer } from "#/server/ai/tools/verify-answer";
import { chatMessageService } from "#/server/chat/messages";
import { chatSessionService } from "#/server/chat/sessions";
import { fallbackChatTitle } from "#/server/chat/title-generation";
import { chatToolCallService } from "#/server/chat/tool-calls";
import { answerVerificationService } from "#/server/chat/verifications";

import { extractMessageEvidenceSnippets } from "./evidence";
import type { ChatLogger } from "./logger";
import { getMessageText } from "./message-text";

const GENERIC_SESSION_TITLES = new Set([
    "",
    "new chat",
    "new conversation",
    "untitled conversation",
]);

export async function ensureSessionTitle(input: {
    logger?: ChatLogger;
    sessionId: string | undefined;
    titlePrompt: string | undefined;
}) {
    const prompt = input.titlePrompt?.trim();

    if (!(input.sessionId && prompt)) {
        return;
    }

    const session = await chatSessionService.get(input.sessionId);
    const currentTitle = session?.title?.trim() ?? "";

    if (!GENERIC_SESSION_TITLES.has(currentTitle.toLowerCase())) {
        return;
    }

    const title = fallbackChatTitle(prompt);
    input.logger?.info("session-title:start", { title });

    try {
        await chatSessionService.rename(input.sessionId, title);
        input.logger?.info("session-title:finish", { title });
    } catch (error) {
        input.logger?.info("session-title:error", {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

export async function persistLatestUserMessage(
    sessionId: string | undefined,
    messages: UIMessage[],
    logger?: ChatLogger
) {
    if (!sessionId) {
        return;
    }

    const latestUserMessage = messages.findLast(
        (message) => message.role === "user"
    );

    if (!latestUserMessage) {
        return;
    }

    const content = getMessageText(latestUserMessage);
    logger?.info("persist-user-message:start");
    await chatMessageService.create({
        content,
        id: latestUserMessage.id,
        parts: latestUserMessage.parts,
        role: "user",
        sessionId,
    });
    logger?.info("persist-user-message:finish");

    return content;
}

export async function persistAssistantContent(input: {
    content: string;
    evidenceSnippets: string[];
    id?: string;
    logger?: ChatLogger;
    metadata?: unknown;
    mode: "general_rag" | "verified_numeric";
    parts?: unknown;
    sessionId?: string;
    sourceCount?: number;
    trustedSourceCount?: number;
}) {
    if (!input.sessionId) {
        return;
    }

    input.logger?.info("persist-assistant-message:start", {
        contentLength: input.content.length,
    });
    const message = await chatMessageService.create({
        content: input.content,
        id: input.id,
        metadata: input.metadata,
        parts: input.parts,
        role: "assistant",
        sessionId: input.sessionId,
    });

    await chatToolCallService.attachUnlinkedToMessage(
        input.sessionId,
        message.id
    );

    const sourceCount =
        input.sourceCount ?? (input.evidenceSnippets.length > 0 ? 1 : 0);
    const trustedSourceCount =
        input.trustedSourceCount ??
        (input.mode === "verified_numeric" && sourceCount > 0 ? 1 : 0);
    const verification = verifyAnswer({
        draftText: input.content,
        evidenceSnippets: input.evidenceSnippets,
        mode: input.mode,
        sourceCount,
        trustedSourceCount,
        warnings: [],
    });

    await answerVerificationService.create({
        checks: verification.checks,
        confidenceState: verification.confidenceState,
        messageId: message.id,
        mode: input.mode,
        sessionId: input.sessionId,
        warnings: verification.warnings,
    });
    input.logger?.info("persist-assistant-message:finish", {
        confidenceState: verification.confidenceState,
        messageId: message.id,
    });
}

export async function persistAssistantMessage(input: {
    logger?: ChatLogger;
    message: UIMessage;
    mode: "general_rag" | "verified_numeric";
    sessionId?: string;
}) {
    await persistAssistantContent({
        content: getMessageText(input.message),
        evidenceSnippets: extractMessageEvidenceSnippets(input.message),
        id: input.message.id,
        logger: input.logger,
        metadata: input.message.metadata,
        mode: input.mode,
        parts: input.message.parts,
        sessionId: input.sessionId,
    });
}
