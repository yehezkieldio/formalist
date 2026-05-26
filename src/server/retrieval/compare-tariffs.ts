import { searchTariffs } from "./structured-search";
import type { TariffSearchFilters } from "./structured-search";

export async function compareTariffs(
    filters: TariffSearchFilters,
    mode:
        | "cheapest"
        | "latest"
        | "promo"
        | "regular"
        | "unspecified" = "unspecified"
) {
    const rows = await searchTariffs(filters);

    if (
        mode === "unspecified" &&
        rows.some((row) => row.isPromo) &&
        rows.some((row) => !row.isPromo)
    ) {
        return {
            ambiguity: "promo_regular",
            rows,
        };
    }

    let filteredRows = rows;

    if (mode === "promo") {
        filteredRows = rows.filter((row) => row.isPromo);
    } else if (mode === "regular") {
        filteredRows = rows.filter((row) => !row.isPromo);
    }

    const sortedRows =
        mode === "cheapest"
            ? filteredRows.toSorted(
                  (left, right) =>
                      (left.smuPricePerKg ?? Number.MAX_SAFE_INTEGER) -
                      (right.smuPricePerKg ?? Number.MAX_SAFE_INTEGER)
              )
            : filteredRows.toSorted((left, right) =>
                  String(right.validFrom ?? "").localeCompare(
                      String(left.validFrom ?? "")
                  )
              );

    return {
        ambiguity: null,
        rows: sortedRows,
    };
}
