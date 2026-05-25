export interface NormalizedAirline {
    canonical: string | null;
    issues: string[];
}

const AIRLINE_ALIASES = new Map<string, string>([
    ["pelita", "Pelita Air"],
    ["pelita air", "Pelita Air"],
    ["lion", "Lion Air"],
    ["lion air", "Lion Air"],
    ["sriwijaya", "Sriwijaya Air"],
    ["sriwijaya air", "Sriwijaya Air"],
]);

export function normalizeAirline(
    value: string | null | undefined
): NormalizedAirline {
    const trimmed = value?.trim();

    if (!trimmed) {
        return { canonical: null, issues: ["missing_airline"] };
    }

    const canonical = AIRLINE_ALIASES.get(trimmed.toLowerCase());

    if (canonical) {
        return { canonical, issues: [] };
    }

    return { canonical: trimmed, issues: ["unknown_airline"] };
}
