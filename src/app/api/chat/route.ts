import { handleChatRequest } from "#/server/ai/chat-route";

export const maxDuration = 60;

export function POST(request: Request) {
    return handleChatRequest(request);
}
