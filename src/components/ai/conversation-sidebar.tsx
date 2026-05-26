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
                "group relative flex items-center gap-1 rounded-none border-l-2 border-transparent transition-all pl-2.5 pr-1 py-0.5 select-none",
                active
                    ? "border-emerald-500 bg-muted/20 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/15 hover:text-foreground"
            )}
        >
            {editing ? (
                <form
                    className="min-w-0 flex-1 px-1 py-1"
                    onSubmit={renameSession}
                >
                    <input
                        aria-label="Conversation title"
                        className="h-7 w-full rounded-none border border-border/60 bg-background px-2 text-[11px] font-mono outline-none focus-visible:border-foreground/45"
                        onBlur={() => setEditing(false)}
                        onChange={(event) => setTitle(event.target.value)}
                        value={title}
                        autoFocus
                    />
                </form>
            ) : (
                <Link
                    className="min-w-0 flex-1 truncate py-1.5 px-1 text-[11px] font-mono tracking-tight uppercase"
                    href={`/chat/${session.id}`}
                >
                    {session.title ?? "Untitled conversation"}
                </Link>
            )}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                <Button
                    aria-label="Rename conversation"
                    disabled={isPending}
                    onClick={() => setEditing(true)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                    className="h-6 w-6 active:scale-95 text-muted-foreground/60 hover:text-foreground"
                >
                    <PencilIcon className="size-3" aria-hidden="true" />
                </Button>
                <Button
                    aria-label="Delete conversation"
                    disabled={isPending}
                    onClick={deleteSession}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                    className="h-6 w-6 active:scale-95 text-muted-foreground/60 hover:text-destructive"
                >
                    {isPending ? (
                        <MoreHorizontalIcon
                            className="size-3 animate-pulse"
                            aria-hidden="true"
                        />
                    ) : (
                        <Trash2Icon className="size-3" aria-hidden="true" />
                    )}
                </Button>
            </div>
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
                "min-h-0 flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground overflow-hidden shrink-0 transition-[width] duration-300 ease-in-out",
                collapsed
                    ? "hidden md:flex md:w-14 items-center px-2 py-3 gap-3"
                    : "flex w-full md:w-64"
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
                        className="flex flex-col items-center gap-3 w-full animate-fade-in"
                    >
                        <Button
                            aria-label="Expand sidebar"
                            onClick={() => onCollapsedChange(false)}
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="active:scale-95 transition-transform"
                        >
                            <PanelLeftOpenIcon
                                className="size-4"
                                aria-hidden="true"
                            />
                        </Button>
                        <Button
                            asChild
                            aria-label="Admin dashboard"
                            size="icon"
                            variant="ghost"
                            className="active:scale-95 transition-transform"
                        >
                            <Link href="/admin">
                                <LayoutDashboardIcon
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </Button>
                        <Button
                            aria-label="New chat"
                            disabled={isPending}
                            onClick={createSession}
                            size="icon"
                            type="button"
                            variant="ghost"
                            className="active:scale-95 transition-transform"
                        >
                            <MessageSquarePlusIcon
                                className="size-4"
                                aria-hidden="true"
                            />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{
                            damping: 20,
                            stiffness: 150,
                            type: "spring",
                        }}
                        className="flex flex-col h-full w-full md:w-64 shrink-0"
                    >
                        <header className="flex items-center justify-between gap-2 border-b border-border/40 p-4">
                            <Link
                                className="font-mono text-xs font-bold tracking-widest text-foreground uppercase"
                                href="/chat"
                            >
                                FORMALIST
                            </Link>
                            <div className="flex items-center gap-0.5">
                                <Button
                                    aria-label="New chat"
                                    disabled={isPending}
                                    onClick={createSession}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                    className="h-8 w-8 active:scale-95 transition-transform"
                                >
                                    <MessageSquarePlusIcon
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </Button>
                                <Button
                                    aria-label="Collapse sidebar"
                                    className="hidden md:inline-flex h-8 w-8 active:scale-95 transition-transform"
                                    onClick={() => onCollapsedChange(true)}
                                    size="icon"
                                    type="button"
                                    variant="ghost"
                                >
                                    <PanelLeftCloseIcon
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </Button>
                            </div>
                        </header>
                        <div className="border-b border-border/40 p-3">
                            <label className="relative block">
                                <span className="sr-only">Search chats</span>
                                <SearchIcon
                                    aria-hidden="true"
                                    className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/50"
                                />
                                <input
                                    aria-label="Search chats"
                                    className="h-8 w-full rounded-none border border-border/60 bg-muted/5 pr-3 pl-9 text-xs font-mono outline-none transition-colors focus:border-foreground/45 placeholder:text-muted-foreground/35"
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search chats..."
                                    value={query}
                                />
                            </label>
                        </div>
                        <nav
                            className="min-h-0 flex-1 overflow-auto p-2"
                            aria-label="Conversations"
                        >
                            <div className="flex flex-col gap-0.5">
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
                                    <p className="px-3 py-4 text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                                        No chats found
                                    </p>
                                ) : null}
                            </div>
                        </nav>
                        <footer className="grid gap-2 border-t border-border/40 p-4 bg-muted/5">
                            <Button
                                asChild
                                className="justify-start font-mono text-[10px] uppercase tracking-wider rounded-none border border-border/60 hover:bg-muted/20 active:scale-[0.98] transition-all"
                                variant="outline"
                            >
                                <Link href="/admin">
                                    <LayoutDashboardIcon
                                        aria-hidden="true"
                                        className="size-3.5 text-muted-foreground/80 mr-1.5"
                                    />
                                    Admin dashboard
                                </Link>
                            </Button>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}
