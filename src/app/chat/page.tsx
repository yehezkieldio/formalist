import { redirect } from "next/navigation";

import { chatSessionService } from "#/server/chat/sessions";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
    const session =
        (await chatSessionService.getMostRecentEmpty()) ??
        (await chatSessionService.getMostRecent()) ??
        (await chatSessionService.create("New conversation"));

    redirect(`/chat/${session.id}`);
}
