import { ChunkTable } from "#/components/admin/chunk-table";
import { listChunksForAdmin } from "#/server/db/queries/chunks";

export default async function ChunksPage() {
    const { documentChunks, tableChunks } = await listChunksForAdmin();

    return (
        <div className="grid gap-6">
            <section>
                <h1 className="font-semibold text-2xl">Chunks</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    Inspect semantic chunks and table-aware chunks.
                </p>
            </section>
            <ChunkTable chunks={documentChunks} tableChunks={tableChunks} />
        </div>
    );
}
