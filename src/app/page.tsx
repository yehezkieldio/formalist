export default function Home() {
    const verses = [
        [
            "Do not go gentle into that good night",
            "Hold the last light plainly in your hands.",
            "Let dusk arrive without surrender.",
        ],
        [
            "The quiet has no claim on fire.",
            "Evening can gather at the glass,",
            "but the heart keeps its weather bright.",
        ],
        [
            "Stand where the dark begins to speak.",
            "Answer with breath, with pulse, with nerve.",
            "Make night remember what you carried.",
        ],
    ];

    return (
        <main className="min-h-dvh bg-[oklch(0.985_0.004_106)] px-5 py-6 text-[oklch(0.16_0.012_255)] sm:px-8 lg:px-12">
            <article className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-384 flex-col justify-between gap-8">
                <header className="flex items-start justify-between gap-8">
                    <p className="text-[0.7rem] font-medium tracking-[0.34em] text-[oklch(0.47_0.014_255)] uppercase">
                        Dylan Thomas
                    </p>
                    <p className="max-w-42 text-right text-xs leading-5 text-[oklch(0.48_0.012_255)]">
                        A spare study in resistance, light, and refusal.
                    </p>
                </header>

                <div className="grid items-end gap-9 lg:grid-cols-[minmax(25rem,1fr)_minmax(0,1.7fr)] lg:gap-12">
                    <h1 className="max-w-148 text-balance font-medium text-[clamp(2.25rem,4.6vw,4.8rem)] leading-[0.94] tracking-tight">
                        Do not go gentle into that strong night
                    </h1>

                    <div className="grid gap-6 md:grid-cols-3 md:gap-6">
                        {verses.map((verse, index) => (
                            <section
                                className="space-y-2 text-pretty text-[0.9rem] leading-6 text-[oklch(0.28_0.014_255)]"
                                key={verse[0]}
                            >
                                <p className="mb-4 text-sm text-[oklch(0.63_0.012_255)]">
                                    0{index + 1}
                                </p>
                                {verse.map((line) => (
                                    <p className="text-xs" key={line}>
                                        {line}
                                    </p>
                                ))}
                            </section>
                        ))}
                    </div>
                </div>

                <footer className="flex items-end justify-between gap-8 text-xs text-[oklch(0.52_0.012_255)]">
                    <p>
                        Minimalist Next.js template to quicky prototype ideas.
                    </p>
                    <p className="text-[0.7rem] font-medium tracking-[0.34em] text-[oklch(0.47_0.014_255)] uppercase text-right">
                        Vespasian
                    </p>
                </footer>
            </article>
        </main>
    );
}
