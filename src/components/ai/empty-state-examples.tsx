import { MessageSquareIcon } from "lucide-react";

const examples = [
    "Harga Pelita ke Surabaya berapa?",
    "Kalau 20 kg ke Surabaya pakai Pelita total berapa?",
    "Ringkas isi dokumen aktif Pelita Air",
    "Baris mana yang masih perlu review?",
] as const;

export function EmptyStateExamples() {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-12">
            <div className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border bg-card">
                    <MessageSquareIcon aria-hidden="true" />
                </div>
                <div>
                    <h1 className="font-semibold text-2xl tracking-normal">
                        Ask about tariff documents
                    </h1>
                    <p className="mt-2 text-muted-foreground leading-7">
                        General questions use cited chunks. Prices and quotes
                        require reviewed active facts.
                    </p>
                </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {examples.map((example) => (
                    <div
                        className="rounded-md border bg-background p-3 text-sm"
                        key={example}
                    >
                        {example}
                    </div>
                ))}
            </div>
        </div>
    );
}
