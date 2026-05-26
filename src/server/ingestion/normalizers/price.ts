import Decimal from "decimal.js";

export type PriceParseStatus = "invalid" | "missing" | "na" | "numeric";

export interface ParsedPrice {
    amount: number | null;
    normalizedText: string | null;
    status: PriceParseStatus;
}

const NA_PATTERN = /^(n\/?a|na|n\.a\.|-|tidak tersedia)$/iu;
const DIGIT_PATTERN = /\d/u;

export function parsePrice(
    value: string | number | null | undefined
): ParsedPrice {
    if (value === null || value === undefined || value === "") {
        return { amount: null, normalizedText: null, status: "missing" };
    }

    const raw = String(value).trim();

    if (NA_PATTERN.test(raw)) {
        return { amount: null, normalizedText: raw, status: "na" };
    }

    if (!DIGIT_PATTERN.test(raw)) {
        return { amount: null, normalizedText: raw, status: "invalid" };
    }

    const numericText = raw
        .replaceAll(/\b(idr|rp|rupiah)\b/giu, "")
        .replaceAll(/[^\d.,-]/gu, "")
        .trim();
    const hasComma = numericText.includes(",");
    const hasDot = numericText.includes(".");
    const lastSeparator = Math.max(
        numericText.lastIndexOf(","),
        numericText.lastIndexOf(".")
    );
    const separatorTail =
        lastSeparator === -1 ? "" : numericText.slice(lastSeparator + 1);
    const usesThousandsSeparators =
        separatorTail.length === 3 && (hasComma !== hasDot || hasDot);
    const normalized = usesThousandsSeparators
        ? numericText.replaceAll(/[.,]/gu, "")
        : numericText.replaceAll(",", ".");

    try {
        const decimal = new Decimal(normalized);

        if (!decimal.isFinite() || decimal.isNegative()) {
            return { amount: null, normalizedText: raw, status: "invalid" };
        }

        return {
            amount: decimal.toNearest(1).toNumber(),
            normalizedText: decimal.toFixed(0),
            status: "numeric",
        };
    } catch {
        return { amount: null, normalizedText: raw, status: "invalid" };
    }
}
