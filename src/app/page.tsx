import { ArrowRightIcon, DatabaseIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card";

const capabilities = [
    {
        description:
            "General document questions use semantic and table-aware chunks with citations.",
        title: "Source-grounded RAG",
    },
    {
        description:
            "Prices, dates, routes, fees, and quotes are gated by reviewed active facts.",
        title: "Verified numeric mode",
    },
    {
        description:
            "Quote totals are produced by deterministic TypeScript application code.",
        title: "Deterministic quoting",
    },
] as const;

export default function Home() {
    return (
        <main className="min-h-dvh bg-background text-foreground">
            <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md border bg-card">
                            <DatabaseIcon aria-hidden="true" />
                        </div>
                        <div>
                            <p className="font-semibold">Formalist</p>
                            <p className="text-muted-foreground text-xs">
                                Air cargo tariff assistant
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary">First version build</Badge>
                </header>

                <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col gap-7">
                        <div className="flex max-w-3xl flex-col gap-5">
                            <Badge className="w-fit" variant="outline">
                                Agentic RAG with human-reviewed facts
                            </Badge>
                            <h1 className="max-w-3xl text-balance font-semibold text-4xl tracking-normal sm:text-5xl lg:text-6xl">
                                Chat with tariff documents without trusting raw
                                table text blindly.
                            </h1>
                            <p className="max-w-2xl text-lg text-muted-foreground leading-8">
                                Formalist ingests PDF, DOCX, and TXT pricelists,
                                extracts structured tariff memory, requires
                                operator review for high-stakes numeric data,
                                and answers with source evidence.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild>
                                <Link href="/chat">
                                    Open chat
                                    <ArrowRightIcon
                                        aria-hidden="true"
                                        data-icon="inline-end"
                                    />
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin">Admin dashboard</Link>
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="mb-2 flex size-10 items-center justify-center rounded-md border bg-background">
                                <ShieldCheckIcon aria-hidden="true" />
                            </div>
                            <CardTitle>Trust boundary</CardTitle>
                            <CardDescription>
                                The chatbot may summarize chunks, but trusted
                                price answers require active reviewed data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {capabilities.map((capability) => (
                                <div
                                    className="rounded-md border bg-background p-4"
                                    key={capability.title}
                                >
                                    <p className="font-medium">
                                        {capability.title}
                                    </p>
                                    <p className="mt-1 text-muted-foreground text-sm leading-6">
                                        {capability.description}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    );
}
