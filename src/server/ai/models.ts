import { env } from "#/env";

export const defaultChatModel = "deepseek/deepseek-v4-flash";
export const defaultEmbeddingModel = "qwen/qwen3-embedding-8b";

export interface ModelConfiguration {
    chatModel: string;
    classifierModel: string;
    embeddingModel: string;
    extractionModel: string;
}

export function getModelConfiguration(): ModelConfiguration {
    return {
        chatModel: env.CHAT_MODEL || defaultChatModel,
        classifierModel: env.CLASSIFIER_MODEL || env.CHAT_MODEL,
        embeddingModel: env.EMBEDDING_MODEL || defaultEmbeddingModel,
        extractionModel: env.EXTRACTION_MODEL || env.CHAT_MODEL,
    };
}
