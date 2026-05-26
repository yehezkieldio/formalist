"use client";

import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

const examples = [
    {
        desc: "Cari tarif dasar maskapai terverifikasi secara instan.",
        tag: "TARIF CARGO",
        title: "Harga Pelita ke Surabaya berapa?",
    },
    {
        desc: "Hitung total biaya pengiriman secara deterministik.",
        tag: "KALKULATOR",
        title: "Kalau 20 kg ke Surabaya pakai Pelita total berapa?",
    },
    {
        desc: "Ringkas ketentuan dan isi dokumen secara otomatis.",
        tag: "RINGKASAN",
        title: "Ringkas isi dokumen aktif Pelita Air",
    },
    {
        desc: "Periksa status baris tarif yang memerlukan tinjauan.",
        tag: "LOG TINJAUAN",
        title: "Baris mana yang masih perlu review?",
    },
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
        <div className="flex h-full min-h-[60dvh] flex-col items-center justify-center px-6 py-12">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex w-full max-w-2xl flex-col items-center"
            >
                {/* Header Section */}
                <motion.div
                    variants={itemVariants}
                    className="mb-10 flex flex-col items-center gap-3 text-center"
                >
                    <h1 className="font-mono text-xl font-bold tracking-tight text-foreground uppercase">
                        FORMALIST
                    </h1>
                    <p className="max-w-[48ch] text-xs leading-relaxed text-muted-foreground">
                        Asisten cerdas terverifikasi untuk penelusuran tarif
                        kargo udara, rute penerbangan, dan perhitungan kalkulasi
                        biaya secara deterministik.
                    </p>
                </motion.div>

                {/* Suggestions Bento Grid */}
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    {examples.map((example) => (
                        <motion.button
                            key={example.title}
                            variants={itemVariants}
                            onClick={() => onSelectExample?.(example.title)}
                            className="group flex cursor-pointer flex-col justify-between border border-border/60 bg-card p-5 text-left outline-none transition-all duration-300 hover:border-foreground/45 hover:bg-muted/15 active:scale-[0.98]"
                        >
                            <div className="flex flex-col">
                                <span className="self-start font-mono text-[8px] tracking-wider text-muted-foreground/75 uppercase border border-border/40 px-1.5 py-0.5 bg-muted/20">
                                    {example.tag}
                                </span>
                                <h3 className="text-xs font-semibold text-foreground/90 mt-3 group-hover:text-foreground transition-colors leading-snug">
                                    {example.title}
                                </h3>
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5 leading-normal">
                                    {example.desc}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center justify-end w-full">
                                <ArrowRightIcon
                                    aria-hidden="true"
                                    className="size-3.5 opacity-30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 text-foreground"
                                />
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
