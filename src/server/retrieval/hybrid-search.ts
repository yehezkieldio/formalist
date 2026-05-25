import { searchDocumentChunks } from "./chunk-search";
import { fullTextSearch } from "./full-text";
import { reciprocalRankFusion } from "./rrf";
import { searchTableChunks } from "./table-search";

export interface HybridSearchInput {
    documentId?: string;
    includeArchivedDocuments?: boolean;
    limit?: number;
    query: string;
    validOn?: string;
}

function shouldIncludeArchivedDocuments(input: HybridSearchInput) {
    if (input.includeArchivedDocuments) {
        return true;
    }

    return /\b(archived|archive|historical|history|old|superseded|arsip|lama)\b/iu.test(
        input.query
    );
}

export async function hybridSearch(input: HybridSearchInput) {
    const includeArchivedDocuments = shouldIncludeArchivedDocuments(input);
    const searchInput = { ...input, includeArchivedDocuments };
    const [chunks, tables, fullText] = await Promise.all([
        searchDocumentChunks(searchInput),
        searchTableChunks(searchInput),
        fullTextSearch({
            ...searchInput,
            ownerTypes: ["document_chunk", "table_chunk"],
        }),
    ]);

    return reciprocalRankFusion([chunks, tables, fullText]).slice(
        0,
        input.limit ?? 10
    );
}
