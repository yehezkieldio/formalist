import { searchTariffs } from "./structured-search";

export async function listDestinations() {
    const rows = await searchTariffs({});
    const byDestination = new Map<string, (typeof rows)[number][]>();

    for (const row of rows) {
        const key = `${row.destinationCity ?? "Unknown"}|${row.destinationCode ?? ""}`;
        byDestination.set(key, [...(byDestination.get(key) ?? []), row]);
    }

    return [...byDestination.entries()].map(([key, groupedRows]) => {
        const [city, code] = key.split("|");

        return {
            airlines: [
                ...new Set(
                    groupedRows.map((row) => row.airline).filter(Boolean)
                ),
            ],
            city,
            code,
            origins: [
                ...new Set(
                    groupedRows.map((row) => row.originCity).filter(Boolean)
                ),
            ],
            promo: groupedRows.some((row) => row.isPromo),
            routeTypes: [...new Set(groupedRows.map((row) => row.routeType))],
            sourceCount: groupedRows.length,
        };
    });
}
