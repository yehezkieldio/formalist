import { NextResponse } from "next/server";

import { chatMessageService } from "#/server/chat/messages";

import { createMessageSchema } from "../../schema";

interface MessagesRouteContext {
    params: Promise<{ sessionId: string }>;
}

export async function GET(_request: Request, context: MessagesRouteContext) {
    const { sessionId } = await context.params;

    return NextResponse.json({
        messages: await chatMessageService.list(sessionId),
    });
}

export async function POST(request: Request, context: MessagesRouteContext) {
    const { sessionId } = await context.params;
    const input = createMessageSchema.parse(await request.json());
    const message = await chatMessageService.create({
        ...input,
        sessionId,
    });

    return NextResponse.json({ message }, { status: 201 });
}
