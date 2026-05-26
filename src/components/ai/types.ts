import type { ChatSourceType, ConfidenceState } from "#/server/db/schema";

export type ChatRole = "assistant" | "system" | "tool" | "user";

export interface ChatSourceCardData {
    id: string;
    metadata?: unknown;
    snippet?: string | null;
    sourceId: string;
    sourceType: ChatSourceType;
    title: string;
}

export interface ChatToolCallData {
    completedAt?: Date | string | null;
    error?: string | null;
    id: string;
    input?: unknown;
    output?: unknown;
    startedAt: Date | string;
    state: "error" | "pending" | "running" | "success";
    toolName: string;
}

export interface ChatVerificationData {
    confidenceState: ConfidenceState;
    mode: "general_rag" | "verified_numeric";
    warnings?: unknown;
}

export interface ChatStreamStatus {
    label: string;
    state?: "error" | "running" | "success";
    toolName?: string;
}

export interface FormalistChatMessage {
    content: string;
    createdAt?: Date | string;
    id: string;
    metadata?: {
        reasoning?: string;
        steps?: {
            description?: string;
            label: string;
            status?: "active" | "complete" | "pending";
        }[];
    } | null;
    parts?: unknown;
    role: ChatRole;
    sources?: ChatSourceCardData[];
    toolCalls?: ChatToolCallData[];
    verification?: ChatVerificationData | null;
}

export interface FormalistChatSession {
    createdAt?: Date | string;
    id: string;
    title: null | string;
    updatedAt?: Date | string;
}
