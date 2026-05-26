"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

export default function AdminLoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/login", {
                body: JSON.stringify({ password }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });

            if (res.ok) {
                window.location.href = "/admin";
            } else {
                const data = (await res.json()) as { error?: string };
                setError(data.error ?? "Invalid admin password.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full min-h-[90dvh] flex-col items-center justify-center px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    damping: 20,
                    stiffness: 100,
                    type: "spring",
                }}
                className="w-full max-w-sm border border-border bg-card p-8 flex flex-col gap-6 bg-muted/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
            >
                <div className="flex flex-col gap-2 text-center">
                    <span className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase self-center border border-border px-1.5 py-0.5 bg-muted/20">
                        Formalist Workspace
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-2">
                        Admin Login
                    </h1>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Enter operator password to access the review cockpit.
                    </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label
                            className="font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
                            htmlFor="password"
                        >
                            Operator Password
                        </label>
                        <input
                            aria-label="Admin password"
                            autoComplete="current-password"
                            className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-foreground/45 transition-colors duration-300 font-mono"
                            id="password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            type="password"
                            value={password}
                        />

                        {error && (
                            <div className="text-[10px] text-destructive bg-destructive/10 border border-destructive/25 p-2.5 font-mono uppercase tracking-tight flex items-start gap-1.5 mt-1 select-none">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-3.5 shrink-0 self-center"
                                >
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <button
                        className="w-full h-10 bg-foreground text-background font-mono text-xs hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground/45 active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center"
                        disabled={isLoading}
                        type="submit"
                    >
                        {isLoading ? "AUTHENTICATING..." : "SIGN IN"}
                    </button>
                </form>

                <div className="text-center font-mono text-[9px] border-t border-border/40 pt-4 mt-2">
                    <Link
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        href="/"
                    >
                        &lt; Return to home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
