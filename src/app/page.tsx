"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import Link from "next/link";

const capabilities = [
    {
        className: "md:col-span-2",
        description:
            "General document questions pull from semantic and table-aware chunks with precise citations, preventing groundless answers.",
        tag: "RAG ENGINE",
        title: "Source-Grounded Retrieval",
        visual: (
            <div className="flex flex-col gap-2 font-mono text-[10px] text-muted-foreground/80 mt-4 border border-border p-4 bg-muted/5 w-full">
                <div className="flex items-center justify-between border-b border-border/40 pb-1">
                    <span>DOCUMENT_ID: PL_AIR_2026</span>
                    <span className="text-emerald-500">[CITED]</span>
                </div>
                <div className="text-foreground leading-normal bg-muted/20 p-2 border-l-2 border-foreground">
                    "Tarif Pelita Air Surabaya ke Balikpapan (BPN) minimum
                    charge berlaku Rp 150.000,- per kiriman."
                </div>
                <div className="text-[9px] text-muted-foreground/50">
                    Source: Page 4, Section 2.1 (Tables & Surcharges)
                </div>
            </div>
        ),
    },
    {
        className: "md:col-span-1",
        description:
            "Prices, rates, routes, and schedules require operator verification before they are trusted for numeric responses.",
        tag: "TRUST LAYER",
        title: "Verified Fact Gate",
        visual: (
            <div className="flex flex-col gap-3 mt-4 border border-border p-4 bg-muted/5 w-full font-mono text-[10px]">
                <div className="flex items-center justify-between">
                    <span>Rate Surabaya (SUB):</span>
                    <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-1.5 py-0.5">
                        APPROVED
                    </span>
                </div>
                <div className="flex items-center justify-between opacity-40">
                    <span>Surcharge Peak:</span>
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.5">
                        PENDING_REVIEW
                    </span>
                </div>
            </div>
        ),
    },
    {
        className: "md:col-span-1",
        description:
            "The assistant retrieves tariff rows, table evidence, facts, and source chunks through tool calls before composing an answer.",
        tag: "AGENTIC RAG",
        title: "Tool-Grounded Answers",
        visual: (
            <div className="flex flex-col gap-1.5 mt-4 border border-border p-4 bg-muted/5 w-full font-mono text-[9px] text-muted-foreground/85">
                <div>resolveAliases(query)</div>
                <div className="pl-3 text-foreground">searchTariffs(...)</div>
                <div className="pl-3 text-foreground">hybridSearch(...)</div>
                <div className="pl-3 text-foreground">
                    getSourceEvidence(...)
                </div>
            </div>
        ),
    },
    {
        className: "md:col-span-2",
        description:
            "Converts PDF, DOCX, and TXT files into structured semantic vectors, table rows, and active facts simultaneously.",
        tag: "INGESTION",
        title: "Multi-Memory Parser",
        visual: (
            <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center font-mono text-[9px]">
                <div className="border border-border p-2 bg-muted/10">
                    <div className="font-bold text-foreground">VECTORS</div>
                    <div className="text-muted-foreground/60 mt-1">
                        Semantic Chunks
                    </div>
                </div>
                <div className="border border-border p-2 bg-muted/10">
                    <div className="font-bold text-foreground">TABLES</div>
                    <div className="text-muted-foreground/60 mt-1">
                        Row Extraction
                    </div>
                </div>
                <div className="border border-border p-2 bg-muted/10">
                    <div className="font-bold text-foreground">FACTS</div>
                    <div className="text-muted-foreground/60 mt-1">
                        Structured Key-Val
                    </div>
                </div>
            </div>
        ),
    },
] as const;

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            delayChildren: 0.15,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        transition: {
            damping: 25,
            stiffness: 120,
            type: "spring",
        },
        y: 0,
    },
};

export default function Home() {
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";
    const gitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || "unknown";

    return (
        <main className="min-h-dvh bg-background text-foreground overflow-x-hidden w-full max-w-full">
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-25%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 30s linear infinite;
                }
            `}</style>
            {/* Minimalist Split Navigation */}
            <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link
                        className="font-mono text-sm font-bold tracking-tight text-foreground"
                        href="/"
                    >
                        FORMALIST
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                            href="/admin"
                        >
                            Admin
                        </Link>
                        <Link
                            className="border border-foreground bg-foreground px-4 py-1.5 font-mono text-xs text-background hover:bg-foreground/90 transition-colors"
                            href="/chat"
                        >
                            Open Chat
                        </Link>
                    </div>
                </div>
            </nav>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="mx-auto flex w-full max-w-6xl flex-col px-6"
            >
                {/* Hero Section - Artistic Asymmetry */}
                <section className="py-24 md:py-36 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col"
                    >
                        <h1 className="max-w-5xl text-left text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter leading-[1.08] text-foreground">
                            Chat with air cargo tariffs without trusting raw
                            text{" "}
                            <span className="text-muted-foreground">
                                blindly.
                            </span>
                        </h1>
                        <p className="max-w-[55ch] text-base sm:text-lg text-muted-foreground leading-relaxed mt-6">
                            Formalist ingests pricelists, extracts structured
                            Memory, requires operator review for high-stakes
                            numeric data, and computes quotes using
                            deterministic code.
                        </p>
                        <div className="flex items-center gap-4 mt-8">
                            <Link
                                className="border border-foreground bg-foreground px-6 py-3 font-mono text-sm text-background hover:bg-foreground/90 transition-colors"
                                href="/chat"
                            >
                                Open Chat
                            </Link>
                            <Link
                                className="border border-border bg-transparent px-6 py-3 font-mono text-sm text-foreground hover:bg-muted/30 transition-colors"
                                href="/admin"
                            >
                                Admin Dashboard
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Side: Visualizers & System Architecture Stack */}
                    <div className="flex flex-col gap-4 lg:mt-0">
                        {/* Ingestion Pipeline Card */}
                        <motion.div
                            variants={itemVariants}
                            className="border border-border p-6 bg-muted/5 font-mono text-xs w-full relative flex flex-col gap-4 select-none"
                        >
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="font-bold text-[10px] tracking-wider uppercase text-muted-foreground">
                                        Ingestion Pipeline
                                    </span>
                                </div>
                                <span className="text-muted-foreground/60 text-[10px]">
                                    STABLE
                                </span>
                            </div>
                            <div className="space-y-1 text-muted-foreground">
                                <div className="text-foreground font-semibold">
                                    &gt; parsing cargo_rates_2026.pdf
                                </div>
                                <div>[MEM_1] Created 42 semantic vectors</div>
                                <div>[MEM_2] Extracted 8 tabular matrices</div>
                                <div>[MEM_3] Identified 15 pricing facts</div>
                                <div className="text-emerald-500 font-semibold mt-2">
                                    &gt; awaiting operator approval...
                                </div>
                            </div>
                        </motion.div>

                        {/* System Architecture Card */}
                        <motion.div
                            variants={itemVariants}
                            className="border border-border p-6 bg-muted/5 font-mono text-xs w-full relative flex flex-col gap-4 select-none"
                        >
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="relative inline-flex h-2 w-2 bg-foreground/45"></span>
                                    </span>
                                    <span className="font-bold text-[10px] tracking-wider uppercase text-muted-foreground">
                                        System Architecture
                                    </span>
                                </div>
                                <span className="text-muted-foreground/60 text-[10px]">
                                    VERIFIED_MODE
                                </span>
                            </div>
                            <div className="space-y-2 text-muted-foreground/80 leading-normal">
                                <div>[QUERY] ──&gt; Intent Classifier</div>
                                <div className="pl-4 border-l border-border/40 ml-2 py-1 space-y-1 text-[11px]">
                                    <div>├── RAG: Cited Semantic Chunks</div>
                                    <div>
                                        └── NUMERIC: Reviewed Tariff Facts
                                    </div>
                                </div>
                                <div>[CALC] ──&gt; Deterministic TS Engine</div>
                                <div>
                                    [CITE] ──&gt; Origin Document Provenance
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Infinite Marquee Section */}
                <section className="py-8 border-y border-border overflow-hidden w-full relative bg-muted/5">
                    <div className="flex whitespace-nowrap gap-8 animate-marquee">
                        {Array.from({ length: 4 }).map((_, outerIdx) => (
                            <div
                                key={outerIdx}
                                className="flex gap-8 font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase shrink-0"
                            >
                                <span>PDF INGESTION</span>
                                <span>•</span>
                                <span>TABLE EXTRACTION</span>
                                <span>•</span>
                                <span>VERIFIED NUMERIC MODE</span>
                                <span>•</span>
                                <span>PROVENANCE AUDITING</span>
                                <span>•</span>
                                <span>TYPESCRIPT CALCULATIONS</span>
                                <span>•</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bento Grid - Interest & Features */}
                <section className="py-24 md:py-36">
                    <motion.div
                        variants={itemVariants}
                        className="mb-12 flex flex-col gap-3"
                    >
                        <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                            Architecture
                        </span>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter text-foreground">
                            Engineered for high-stakes answers.
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-border grid-flow-dense gap-0">
                        {capabilities.map((cap) => (
                            <motion.div
                                variants={itemVariants}
                                className={`group flex flex-col justify-between border-r border-b border-border bg-card p-8 min-h-[340px] hover:bg-muted/5 transition-colors duration-300 ${cap.className}`}
                                key={cap.title}
                            >
                                <div>
                                    <span className="font-mono text-[9px] tracking-wider text-muted-foreground/75 uppercase border border-border px-1.5 py-0.5 bg-muted/20">
                                        {cap.tag}
                                    </span>
                                    <h3 className="text-xl font-medium tracking-tight text-foreground mt-4">
                                        {cap.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[55ch]">
                                        {cap.description}
                                    </p>
                                </div>
                                {cap.visual}
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA Action Section */}
                <section className="py-24 md:py-36 border-t border-border flex flex-col items-center justify-center text-center">
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col items-center gap-6"
                    >
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-foreground max-w-2xl leading-none">
                            Ready to query your tariff pricing?
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-[50ch] leading-relaxed">
                            Upload documents, approve extracted facts, and chat
                            instantly with verified calculations.
                        </p>
                        <Link
                            className="border border-foreground bg-foreground px-8 py-4 font-mono text-sm text-background hover:bg-foreground/90 transition-colors mt-4"
                            href="/chat"
                        >
                            Launch Chat Workspace
                        </Link>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border py-12 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-muted-foreground/60 select-none">
                    <div>
                        © {new Date().getFullYear()} Formalist. All rights
                        reserved.
                    </div>
                    <div>
                        Formalist v{appVersion} ({gitHash})
                    </div>
                </footer>
            </motion.div>
        </main>
    );
}
