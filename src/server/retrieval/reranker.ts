import type { RetrievalSource } from "./types";

export interface Reranker {
    rerank: (
        query: string,
        sources: RetrievalSource[]
    ) => Promise<RetrievalSource[]>;
}

export const localCrossEncoderCandidates = [
    "cross-encoder/ettin-reranker-17m-v1",
    "cross-encoder/ettin-reranker-32m-v1",
    "cross-encoder/ettin-reranker-68m-v1",
    "BAAI/bge-reranker-v2-m3",
];

export function createNoopReranker(): Reranker {
    return {
        rerank: (_query, sources) => Promise.resolve(sources),
    };
}
