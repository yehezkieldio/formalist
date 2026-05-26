function formatValue(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return "Not available";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    return String(value);
}

export function DetailRows({
    rows,
    title,
}: {
    rows: [string, unknown][];
    title: string;
}) {
    return (
        <section className="border border-border/60 bg-muted/5 p-4 rounded-none font-mono text-[10px] select-text shadow-sm my-2">
            <h3 className="font-bold uppercase tracking-wider text-foreground/90 border-b border-border/40 pb-2 mb-3 select-none">
                {title}
            </h3>
            <dl className="grid gap-0">
                {rows.map(([label, value]) => (
                    <div
                        className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] gap-x-4 border-t border-border/30 py-2.5 items-start"
                        key={label}
                    >
                        <dt className="font-semibold text-muted-foreground/75 uppercase tracking-wide text-[9px] select-none">
                            {label}
                        </dt>
                        <dd className="break-words font-mono text-[10px] text-foreground/90">
                            {formatValue(value)}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
