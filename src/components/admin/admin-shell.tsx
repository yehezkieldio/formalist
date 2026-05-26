"use client";

import {
    BoxesIcon,
    DatabaseIcon,
    FileTextIcon,
    HomeIcon,
    ListChecksIcon,
    LogOutIcon,
    MessageSquareTextIcon,
    SettingsIcon,
    ShieldCheckIcon,
    TagsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

const primaryNavigation = [
    { href: "/admin", icon: HomeIcon, label: "Overview" },
    { href: "/admin/documents", icon: FileTextIcon, label: "Documents" },
    { href: "/admin/chunks", icon: DatabaseIcon, label: "Chunks" },
    { href: "/admin/facts", icon: ShieldCheckIcon, label: "Facts" },
    { href: "/admin/review", icon: ListChecksIcon, label: "Tariff review" },
    { href: "/admin/fee-rules", icon: BoxesIcon, label: "Fee rules" },
    { href: "/admin/aliases", icon: TagsIcon, label: "Aliases" },
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

    return (
        <main className="min-h-dvh bg-background text-foreground">
            <div className="grid min-h-dvh lg:grid-cols-[17rem_minmax(0,1fr)]">
                <aside className="border-border/80 border-b bg-sidebar text-sidebar-foreground lg:border-r lg:border-b-0">
                    <div className="sticky top-0 flex max-h-dvh flex-col">
                        <header className="flex h-16 items-center justify-between border-border/80 border-b px-4">
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
                            <ThemeToggle />
                        </header>
                        <nav
                            aria-label="Admin sections"
                            className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-y-auto"
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
                                            "group inline-flex h-10 shrink-0 items-center gap-2 px-3 text-sm transition-colors active:translate-y-px lg:w-full",
                                            active
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
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
                        <footer className="mt-auto hidden border-border/80 border-t p-3 lg:block">
                            <div className="grid gap-2">
                                <Button
                                    asChild
                                    className="justify-start"
                                    variant="outline"
                                >
                                    <Link href="/chat">
                                        <MessageSquareTextIcon aria-hidden="true" />
                                        Back to chat
                                    </Link>
                                </Button>
                                <form action="/api/admin/logout" method="post">
                                    <Button
                                        className="w-full justify-start"
                                        type="submit"
                                        variant="ghost"
                                    >
                                        <LogOutIcon aria-hidden="true" />
                                        Sign out
                                    </Button>
                                </form>
                            </div>
                        </footer>
                    </div>
                </aside>
                <section className="min-w-0">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                        {children}
                    </div>
                </section>
            </div>
        </main>
    );
}
