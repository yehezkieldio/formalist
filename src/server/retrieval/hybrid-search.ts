import { searchDocumentChunks } from "./chunk-search";
import { fullTextSearch } from "./full-text";
import { reciprocalRankFusion } from "./rrf";
import { searchTableChunks } from "./table-search";

export async function hybridSearch(input: { limit?: number; query: string }) {
    const [chunks, tables, fullText] = await Promise.all([
        searchDocumentChunks(input),
        searchTableChunks(input),
        fullTextSearch(input),
    ]);

    return reciprocalRankFusion([chunks, tables, fullText]).slice(
        0,
        input.limit ?? 10
    );
}
