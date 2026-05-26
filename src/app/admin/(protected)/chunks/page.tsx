import { DatabaseIcon } from "lucide-react";

import {
    AdminMetricStrip,
    AdminPageHeader,
} from "#/components/admin/admin-primitives";
import { ChunkTable } from "#/components/admin/chunk-table";
import { listChunksForAdmin } from "#/server/db/queries/chunks";

export const dynamic = "force-dynamic";

export default async function ChunksPage() {
    const { documentChunks, tableChunks } = await listChunksForAdmin();

    return (
        <div className="grid gap-6">
            <AdminPageHeader
                description="Inspect the semantic and table chunks the chat retriever can cite. Use this when answers cite weak evidence or rows look malformed."
                eyebrow="Retrieval memory"
                title="Chunks"
            />
            <AdminMetricStrip
                metrics={[
                    { label: "Semantic", value: documentChunks.length },
                    { label: "Table rows", value: tableChunks.length },
                    {
                        label: "Total chunks",
                        value: documentChunks.length + tableChunks.length,
                    },
                    {
                        label: "Mode",
                        value: (
                            <DatabaseIcon
                                aria-hidden="true"
                                className="size-4"
                            />
                        ),
                    },
                ]}
            />
            <ChunkTable chunks={documentChunks} tableChunks={tableChunks} />
        </div>
    );
}
