"use client";

import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

const examples = [
    "Harga Pelita ke Surabaya berapa?",
    "Kalau 20 kg ke Surabaya pakai Pelita total berapa?",
    "Ringkas isi dokumen aktif Pelita Air",
    "Baris mana yang masih perlu review?",
] as const;

interface EmptyStateExamplesProps {
    onSelectExample?: (example: string) => void;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            delayChildren: 0.05,
            staggerChildren: 0.05,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
        opacity: 1,
        transition: {
            damping: 20,
            stiffness: 100,
            type: "spring",
        },
        y: 0,
    },
};

export function EmptyStateExamples({
    onSelectExample,
}: EmptyStateExamplesProps) {
    return (
        <div className="flex h-full min-h-[55dvh] flex-col items-center justify-center px-4 py-8">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex w-full max-w-xl flex-col items-center"
            >
                {/* Header Section */}
                <motion.div
                    variants={itemVariants}
                    className="mb-8 flex flex-col items-center gap-2 text-center"
                >
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        Formalist
                    </h1>
                    <p className="max-w-[45ch] text-xs leading-relaxed text-muted-foreground">
                        Asisten AI untuk pencarian tarif kargo udara, rute,
                        biaya, dan ringkasan dokumen secara instan.
                    </p>
                </motion.div>

                {/* Suggestions Grid */}
                <div className="grid w-full gap-2.5 sm:grid-cols-2">
                    {examples.map((example) => (
                        <motion.button
                            key={example}
                            variants={itemVariants}
                            onClick={() => onSelectExample?.(example)}
                            className="group flex cursor-pointer items-center justify-between border border-border bg-card px-4 py-3 text-left outline-none transition-all duration-300 hover:border-foreground/45 hover:bg-muted/15 active:scale-[0.98]"
                        >
                            <span className="text-xs font-medium leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground">
                                {example}
                            </span>
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-3.5 shrink-0 self-center opacity-40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                            />
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
