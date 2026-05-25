import { ChatShell } from "#/components/ai/chat-shell";
import { chatSessionService } from "#/server/chat/sessions";

export default async function ChatPage() {
    const sessions = await chatSessionService.list();

    return (
        <ChatShell
            initialMessages={[]}
            sessions={sessions.map((session) => ({
                createdAt: session.createdAt,
                id: session.id,
                title: session.title,
                updatedAt: session.updatedAt,
            }))}
        />
    );
}
