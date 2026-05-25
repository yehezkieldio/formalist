import { NextResponse } from "next/server";
import * as z from "zod";

import { chatSourceTypes } from "#/server/db/schema";
import { buildSourcePreview } from "#/server/retrieval/source-preview";

const paramsSchema = z.object({
    sourceId: z.uuid(),
    sourceType: z.enum(chatSourceTypes),
});

interface SourcePreviewRouteContext {
    params: Promise<{
        sourceId: string;
        sourceType: string;
    }>;
}

export async function GET(
    _request: Request,
    context: SourcePreviewRouteContext
) {
    const params = paramsSchema.parse(await context.params);
    const preview = await buildSourcePreview(
        params.sourceType,
        params.sourceId
    );

    if (!preview) {
        return NextResponse.json(
            { error: "Source evidence was not found." },
            { status: 404 }
        );
    }

    return NextResponse.json(preview);
}
