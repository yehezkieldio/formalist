import { SourceSnippetPreview } from "./source-snippet-preview";

export function ChunkTable({
    chunks,
    tableChunks,
}: {
    chunks: {
        content: string;
        documentId: string;
        id: string;
        pageNumber: number | null;
        status: string;
    }[];
    tableChunks: {
        documentId: string;
        id: string;
        pageNumber: number | null;
        rowText: string;
        status: string;
    }[];
}) {
    return (
        <div className="grid gap-4">
            {chunks.map((chunk) => (
                <SourceSnippetPreview
                    key={chunk.id}
                    documentId={chunk.documentId}
                    pageNumber={chunk.pageNumber}
                    snippet={chunk.content}
                    sourceType={`document_chunk:${chunk.status}`}
                />
            ))}
            {tableChunks.map((chunk) => (
                <SourceSnippetPreview
                    key={chunk.id}
                    documentId={chunk.documentId}
                    pageNumber={chunk.pageNumber}
                    snippet={chunk.rowText}
                    sourceType={`table_chunk:${chunk.status}`}
                />
            ))}
        </div>
    );
}
