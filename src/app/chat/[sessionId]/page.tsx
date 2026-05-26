import { notFound } from "next/navigation";

import { ChatShell } from "#/components/ai/chat-shell";
import { chatSessionService } from "#/server/chat/sessions";
import { getChatMessagesForView } from "#/server/chat/view-model";

export const dynamic = "force-dynamic";

interface ChatSessionPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ChatSessionPage({
    params,
}: ChatSessionPageProps) {
    const { sessionId } = await params;
    const [session, sessions, messages] = await Promise.all([
        chatSessionService.get(sessionId),
        chatSessionService.list(),
        getChatMessagesForView(sessionId),
    ]);

    if (!session || session.deletedAt) {
        notFound();
    }

    return (
        <ChatShell
            activeSessionId={sessionId}
            initialMessages={messages}
            sessions={sessions.map((item) => ({
                createdAt: item.createdAt,
                id: item.id,
                title: item.title,
                updatedAt: item.updatedAt,
            }))}
        />
    );
}
