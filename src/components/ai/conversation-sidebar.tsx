"use client";

import {
    MessageSquarePlusIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PanelLeftCloseIcon,
    SearchIcon,
    Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import type { FormalistChatSession } from "#/components/ai/types";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

function ConversationRow({
    active,
    session,
}: {
    active: boolean;
    session: FormalistChatSession;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(
        session.title ?? "Untitled conversation"
    );
    const [isPending, startTransition] = useTransition();

    const renameSession = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextTitle = title.trim();

        if (!nextTitle) {
            return;
        }

        startTransition(async () => {
            await fetch(`/api/chat/sessions/${session.id}`, {
                body: JSON.stringify({ title: nextTitle }),
                headers: { "content-type": "application/json" },
                method: "PATCH",
            });
            setEditing(false);
            router.refresh();
        });
    };

    const deleteSession = () => {
        startTransition(async () => {
            await fetch(`/api/chat/sessions/${session.id}`, {
                method: "DELETE",
            });
            router.refresh();
            if (active) {
                router.push("/chat");
            }
        });
    };

    return (
        <div
            className={cn(
                "group flex items-center gap-1 rounded-md",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
        >
            {editing ? (
                <form
                    className="min-w-0 flex-1 px-2 py-1"
                    onSubmit={renameSession}
                >
                    <input
                        aria-label="Conversation title"
                        className="h-8 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onBlur={() => setEditing(false)}
                        onChange={(event) => setTitle(event.target.value)}
                        value={title}
                    />
                </form>
            ) : (
                <Link
                    className="min-w-0 flex-1 truncate px-3 py-2 text-sm"
                    href={`/chat/${session.id}`}
                >
                    {session.title ?? "Untitled conversation"}
                </Link>
            )}
            <Button
                aria-label="Rename conversation"
                disabled={isPending}
                onClick={() => setEditing(true)}
                size="icon-sm"
                type="button"
                variant="ghost"
            >
                <PencilIcon aria-hidden="true" />
            </Button>
            <Button
                aria-label="Delete conversation"
                disabled={isPending}
                onClick={deleteSession}
                size="icon-sm"
                type="button"
                variant="ghost"
            >
                {isPending ? (
                    <MoreHorizontalIcon aria-hidden="true" />
                ) : (
                    <Trash2Icon aria-hidden="true" />
                )}
            </Button>
        </div>
    );
}

export function ConversationSidebar({
    activeSessionId,
    sessions,
}: {
    activeSessionId?: string;
    sessions: FormalistChatSession[];
}) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    const filteredSessions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return sessions;
        }

        return sessions.filter((session) =>
            (session.title ?? "Untitled conversation")
                .toLowerCase()
                .includes(normalizedQuery)
        );
    }, [query, sessions]);

    const createSession = () => {
        startTransition(async () => {
            const response = await fetch("/api/chat/sessions", {
                body: JSON.stringify({ title: "New conversation" }),
                headers: { "content-type": "application/json" },
                method: "POST",
            });
            const payload = (await response.json()) as {
                session?: FormalistChatSession;
            };

            if (payload.session) {
                router.push(`/chat/${payload.session.id}`);
                router.refresh();
            }
        });
    };

    return (
        <aside className="flex min-h-0 w-full flex-col border-r bg-sidebar text-sidebar-foreground md:w-72">
            <header className="flex items-center justify-between gap-2 border-b p-3">
                <Link className="font-semibold" href="/chat">
                    Formalist
                </Link>
                <div className="flex items-center gap-1">
                    <Button
                        aria-label="New chat"
                        disabled={isPending}
                        onClick={createSession}
                        size="icon"
                        type="button"
                        variant="ghost"
                    >
                        <MessageSquarePlusIcon aria-hidden="true" />
                    </Button>
                    <Button
                        aria-label="Collapse sidebar"
                        className="hidden md:inline-flex"
                        size="icon"
                        type="button"
                        variant="ghost"
                    >
                        <PanelLeftCloseIcon aria-hidden="true" />
                    </Button>
                </div>
            </header>
            <div className="border-b p-3">
                <label className="relative block">
                    <span className="sr-only">Search chats</span>
                    <SearchIcon
                        aria-hidden="true"
                        className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        aria-label="Search chats"
                        className="h-9 w-full rounded-md border bg-background pr-3 pl-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search chats"
                        value={query}
                    />
                </label>
            </div>
            <nav
                className="min-h-0 flex-1 overflow-auto p-2"
                aria-label="Conversations"
            >
                <div className="flex flex-col gap-1">
                    {filteredSessions.map((session) => (
                        <ConversationRow
                            active={session.id === activeSessionId}
                            key={session.id}
                            session={session}
                        />
                    ))}
                    {filteredSessions.length === 0 ? (
                        <p className="px-3 py-4 text-muted-foreground text-sm">
                            No conversations found.
                        </p>
                    ) : null}
                </div>
            </nav>
            <footer className="border-t p-3">
                <Button asChild className="w-full" variant="outline">
                    <Link href="/admin">Admin dashboard</Link>
                </Button>
            </footer>
        </aside>
    );
}
