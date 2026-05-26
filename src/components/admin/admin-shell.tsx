"use client";

import {
    FileTextIcon,
    HomeIcon,
    LogOutIcon,
    MessageSquareTextIcon,
    PanelLeftCloseIcon,
    PanelLeftOpenIcon,
    SettingsIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

const primaryNavigation = [
    { href: "/admin", icon: HomeIcon, label: "Overview" },
    { href: "/admin/documents", icon: FileTextIcon, label: "Documents" },
    { href: "/admin/settings", icon: SettingsIcon, label: "Settings" },
] as const;

function isActivePath(pathname: string, href: string) {
    if (href === "/admin") {
        return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <main className="flex h-dvh flex-col lg:flex-row overflow-hidden bg-background text-foreground">
            {/* Desktop Sidebar with Animated Width & Transitions */}
            <aside
                className={cn(
                    "min-h-0 flex-col border-r bg-sidebar text-sidebar-foreground overflow-hidden shrink-0 transition-[width] duration-300 ease-in-out hidden lg:flex",
                    collapsed
                        ? "lg:w-14 items-center px-2 py-3 gap-3"
                        : "lg:w-64"
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
                                onClick={() => setCollapsed(false)}
                                size="icon"
                                type="button"
                                variant="ghost"
                            >
                                <PanelLeftOpenIcon aria-hidden="true" />
                            </Button>

                            <nav
                                aria-label="Admin sections minimized"
                                className="flex flex-col gap-1 w-full items-center mt-4"
                            >
                                {primaryNavigation.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActivePath(
                                        pathname,
                                        item.href
                                    );

                                    return (
                                        <Link
                                            aria-label={item.label}
                                            aria-current={
                                                active ? "page" : undefined
                                            }
                                            className={cn(
                                                "flex size-9 items-center justify-center border border-transparent transition-all active:translate-y-px",
                                                active
                                                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-border border"
                                                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                                            )}
                                            href={item.href}
                                            key={item.href}
                                            title={item.label}
                                        >
                                            <Icon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto flex flex-col gap-2 w-full items-center pt-3 border-t border-border/40">
                                <Button
                                    asChild
                                    size="icon"
                                    variant="outline"
                                    title="Back to chat"
                                >
                                    <Link href="/chat">
                                        <MessageSquareTextIcon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Link>
                                </Button>
                                <form action="/api/admin/logout" method="post">
                                    <Button
                                        size="icon"
                                        type="submit"
                                        variant="ghost"
                                        title="Sign out"
                                    >
                                        <LogOutIcon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col h-full w-full lg:w-64 shrink-0"
                        >
                            <header className="flex h-16 items-center justify-between border-b px-4">
                                <Link
                                    className="grid min-w-0 gap-0.5"
                                    href="/admin"
                                >
                                    <span className="truncate font-semibold text-sm">
                                        Formalist Admin
                                    </span>
                                    <span className="truncate text-muted-foreground text-xs">
                                        Review cockpit
                                    </span>
                                </Link>
                                <div className="flex items-center gap-1">
                                    <ThemeToggle />
                                    <Button
                                        aria-label="Collapse sidebar"
                                        onClick={() => setCollapsed(true)}
                                        size="icon"
                                        type="button"
                                        variant="ghost"
                                    >
                                        <PanelLeftCloseIcon aria-hidden="true" />
                                    </Button>
                                </div>
                            </header>

                            <nav
                                aria-label="Admin sections"
                                className="flex flex-col gap-1 overflow-y-auto p-2"
                            >
                                {primaryNavigation.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActivePath(
                                        pathname,
                                        item.href
                                    );

                                    return (
                                        <Link
                                            aria-current={
                                                active ? "page" : undefined
                                            }
                                            className={cn(
                                                "group inline-flex h-10 w-full items-center gap-2 px-3 text-sm transition-colors active:translate-y-px",
                                                active
                                                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-border border"
                                                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                                            )}
                                            href={item.href}
                                            key={item.href}
                                        >
                                            <Icon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <footer className="mt-auto border-t p-3">
                                <div className="grid gap-2">
                                    <Button
                                        asChild
                                        className="justify-start font-mono text-xs"
                                        variant="outline"
                                    >
                                        <Link href="/chat">
                                            <MessageSquareTextIcon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Back to chat
                                        </Link>
                                    </Button>
                                    <form
                                        action="/api/admin/logout"
                                        method="post"
                                    >
                                        <Button
                                            className="w-full justify-start font-mono text-xs"
                                            type="submit"
                                            variant="ghost"
                                        >
                                            <LogOutIcon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            Sign out
                                        </Button>
                                    </form>
                                </div>
                            </footer>
                        </motion.div>
                    )}
                </AnimatePresence>
            </aside>

            {/* Mobile Navigation Header */}
            <aside className="border-b bg-sidebar text-sidebar-foreground lg:hidden shrink-0">
                <header className="flex h-14 items-center justify-between border-b px-4">
                    <Link className="font-semibold text-sm" href="/admin">
                        Formalist Admin
                    </Link>
                    <ThemeToggle />
                </header>
                <nav
                    aria-label="Admin sections mobile"
                    className="flex gap-1 overflow-x-auto p-2"
                >
                    {primaryNavigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActivePath(pathname, item.href);

                        return (
                            <Link
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "group inline-flex h-9 shrink-0 items-center gap-1.5 px-3 text-xs transition-colors active:translate-y-px",
                                    active
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground border-border border"
                                        : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                                )}
                                href={item.href}
                                key={item.href}
                            >
                                <Icon aria-hidden="true" className="size-3.5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Scrollable Content Pane */}
            <section className="min-w-0 flex-1 overflow-auto bg-background text-foreground h-full lg:h-dvh">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                    {children}
                </div>
            </section>
        </main>
    );
}
