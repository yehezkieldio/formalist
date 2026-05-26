import { NextResponse } from "next/server";

import { chatSessionService } from "#/server/chat/sessions";

import { renameSessionSchema } from "../schema";

interface SessionRouteContext {
    params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: SessionRouteContext) {
    const { sessionId } = await context.params;

    return NextResponse.json({
        session: await chatSessionService.get(sessionId),
    });
}

export async function PATCH(request: Request, context: SessionRouteContext) {
    const { sessionId } = await context.params;
    const input = renameSessionSchema.parse(await request.json());

    return NextResponse.json({
        session: await chatSessionService.rename(sessionId, input.title),
    });
}

export async function DELETE(_request: Request, context: SessionRouteContext) {
    const { sessionId } = await context.params;

    return NextResponse.json({
        session: await chatSessionService.softDelete(sessionId),
    });
}
