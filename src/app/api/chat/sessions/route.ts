import { NextResponse } from "next/server";

import { chatSessionService } from "#/server/chat/sessions";

import { createSessionSchema } from "./schema";

export async function GET(request: Request) {
    const query = new URL(request.url).searchParams.get("q");
    const sessions = query
        ? await chatSessionService.search(query)
        : await chatSessionService.list();

    return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
    const input = createSessionSchema.parse(await request.json());
    const session = await chatSessionService.create(input.title);

    return NextResponse.json({ session }, { status: 201 });
}
