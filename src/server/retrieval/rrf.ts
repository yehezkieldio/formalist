import type { RetrievalSource } from "./types";

export function reciprocalRankFusion(
    rankedLists: RetrievalSource[][],
    options: { k?: number; weights?: number[] } = {}
): RetrievalSource[] {
    const k = options.k ?? 60;
    const scores = new Map<string, RetrievalSource>();

    for (const [listIndex, list] of rankedLists.entries()) {
        const weight = options.weights?.[listIndex] ?? 1;

        for (const [rank, source] of list.entries()) {
            const key = `${source.ownerType}:${source.ownerId}`;
            const existing = scores.get(key) ?? {
                ...source,
                componentScores: {},
                score: 0,
            };
            const score = weight / (k + rank + 1);

            existing.score += score;
            existing.componentScores = {
                ...existing.componentScores,
                [`list_${listIndex}`]: score,
            };
            scores.set(key, existing);
        }
    }

    return [...scores.values()].toSorted(
        (left, right) => right.score - left.score
    );
}
