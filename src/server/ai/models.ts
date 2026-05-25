import { env } from "#/env";

export const defaultChatModel = "deepseek/deepseek-v4-flash";
export const defaultEmbeddingModel = "qwen/qwen3-embedding-8b";

export interface ModelConfiguration {
    chatModel: string;
    embeddingModel: string;
}

export function getModelConfiguration(): ModelConfiguration {
    return {
        chatModel: env.CHAT_MODEL || defaultChatModel,
        embeddingModel: env.EMBEDDING_MODEL || defaultEmbeddingModel,
    };
}
