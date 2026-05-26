"use client";

import {
    LayoutDashboardIcon,
    MessageSquarePlusIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
    SearchIcon,
    Trash2Icon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import type { FormalistChatSession } from "#/components/ai/types";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

function ConversationRow({
    active,
    onDeleted,
    onRenamed,
    session,
}: {
    active: boolean;
    onDeleted: (sessionId: string) => void;
    onRenamed: (sessionId: string, title: string) => void;
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
            onRenamed(session.id, nextTitle);
            setEditing(false);
        });
    };

    const deleteSession = () => {
        startTransition(async () => {
            await fetch(`/api/chat/sessions/${session.id}`, {
                method: "DELETE",
            });
            onDeleted(session.id);
            if (active) {
                router.replace("/chat");
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
    collapsed,
    onCollapsedChange,
    onSessionDeleted,
    onSessionRenamed,
    sessions,
}: {
    activeSessionId?: string;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    onSessionDeleted: (sessionId: string) => void;
    onSessionRenamed: (sessionId: string, title: string) => void;
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
            }
        });
    };

    return (
        <aside
            className={cn(
                "min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground overflow-hidden shrink-0 transition-[width] duration-300 ease-in-out",
                collapsed
                    ? "hidden md:flex md:w-14 items-center px-2 py-3 gap-3"
                    : "flex w-full md:w-72"
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                {collapsed ? (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col items-center gap-3 w-full"
                    >
                        <Button
                            aria-label="Expand sidebar"
                            onClick={() => onCollapsedChange(false)}
                            size="icon"
                            type="button"
                            variant="ghost"
                        >
                            <PanelLeftOpenIcon aria-hidden="true" />
                        </Button>
                        <Button
                            asChild
                            aria-label="Admin dashboard"
                            size="icon"
                            variant="ghost"
                        >
                            <Link href="/admin">
                                <LayoutDashboardIcon aria-hidden="true" />
                            </Link>
                        </Button>
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
                    </motion.div>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col h-full w-full md:w-72 shrink-0"
                    >
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
                                    onClick={() => onCollapsedChange(true)}
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
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
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
                                        onDeleted={onSessionDeleted}
                                        onRenamed={onSessionRenamed}
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
                        <footer className="grid gap-2 border-t p-3">
                            <Button
                                asChild
                                className="justify-start font-mono text-xs"
                                variant="outline"
                            >
                                <Link href="/admin">
                                    <LayoutDashboardIcon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Admin dashboard
                                </Link>
                            </Button>
                            <p className="text-center font-mono text-[10px] text-muted-foreground/60 select-none">
                                Formalist v{process.env.NEXT_PUBLIC_APP_VERSION}{" "}
                                ({process.env.NEXT_PUBLIC_GIT_COMMIT_HASH})
                            </p>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}
