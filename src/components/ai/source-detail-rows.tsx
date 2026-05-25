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
        <section className="rounded-md border bg-background p-3">
            <h3 className="font-semibold text-sm">{title}</h3>
            <dl className="mt-3 grid gap-2 text-sm">
                {rows.map(([label, value]) => (
                    <div className="grid gap-1 border-t pt-2" key={label}>
                        <dt className="text-muted-foreground text-xs">
                            {label}
                        </dt>
                        <dd className="break-words">{formatValue(value)}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
