import { parsePrice } from "#/server/ingestion/normalizers/price";
import { normalizeRoute } from "#/server/ingestion/normalizers/route";
import type { ParserResult } from "#/server/ingestion/parsers/types";

import type { ExtractionSourceContext } from "./prompt";
import type {
    DocumentMetadataExtraction,
    TariffRowExtraction,
} from "./schemas";

function priceStatusFromParsed(
    status: ReturnType<typeof parsePrice>["status"]
) {
    if (status === "numeric") {
        return "NUMERIC";
    }

    if (status === "na") {
        return "NA";
    }

    return "MISSING";
}

const monthMap = new Map([
    ["januari", "01"],
    ["februari", "02"],
    ["maret", "03"],
    ["april", "04"],
    ["mei", "05"],
    ["juni", "06"],
    ["juli", "07"],
    ["agustus", "08"],
    ["september", "09"],
    ["oktober", "10"],
    ["november", "11"],
    ["desember", "12"],
]);

function cleanCell(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll(/<br\s*\/?>/giu, " ")
        .replaceAll(/\s+/gu, " ")
        .trim();
}

function nullableCell(value: string | null | undefined) {
    const cleaned = cleanCell(value);

    return cleaned.length > 0 && cleaned !== "-" ? cleaned : null;
}

function splitPipeRow(rowText: string) {
    return rowText
        .split("|")
        .map((cell) => cleanCell(cell))
        .filter((cell, index, cells) => {
            const isBoundary = index === 0 || index === cells.length - 1;

            return !(isBoundary && cell.length === 0);
        });
}

function parseIndonesianDate(value: string) {
    const match = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/iu.exec(value);

    if (!match) {
        return null;
    }

    const [, day, monthName, year] = match;
    const month = monthMap.get(monthName.toLowerCase());

    if (!month) {
        return null;
    }

    return `${year}-${month}-${day.padStart(2, "0")}`;
}

export function extractDeterministicDocumentMetadata(
    parseResult: ParserResult
): DocumentMetadataExtraction {
    const originMatch = /Daerah\s+Asal\s*:\s*([^(\n]+)(?:\(([^)]+)\))?/iu.exec(
        parseResult.rawText
    );
    const effectiveMatch = /Efektif\s+Date\s*:\s*([^\n]+)/iu.exec(
        parseResult.rawText
    );
    const commodityMatch = /KOMODITY\s*:\s*([^\n]+)/iu.exec(
        parseResult.rawText
    );
    const originAirportMatch = /Bandar\s+Udara\s+([A-Z0-9]+)/iu.exec(
        originMatch?.[2] ?? ""
    );
    const effectiveDate = effectiveMatch
        ? parseIndonesianDate(effectiveMatch[1])
        : null;

    return {
        airline: null,
        commodity: nullableCell(commodityMatch?.[1]),
        confidence: 0.9,
        effectiveDate,
        isPromo: /promo/iu.test(parseResult.metadata.sourceFilename),
        originAirport: originAirportMatch?.[1] ?? null,
        originCity: nullableCell(originMatch?.[1]),
        validFrom: effectiveDate,
        validUntil: null,
    };
}

export function extractDeterministicTariffRows(
    parseResult: ParserResult,
    context?: ExtractionSourceContext
): TariffRowExtraction[] {
    const metadata = extractDeterministicDocumentMetadata(parseResult);
    const sourceByPageAndRow = new Map(
        context?.tableChunks.map((chunk) => [
            `${chunk.pageNumber ?? ""}:${chunk.rowIndex ?? ""}:${cleanCell(chunk.rowText)}`,
            chunk,
        ])
    );
    const rows: TariffRowExtraction[] = [];

    for (const table of parseResult.tableLikeBlocks) {
        for (const parsedRow of table.rows) {
            const cells = splitPipeRow(parsedRow.rawText);

            if (cells.length < 8 || !/^\d+$/u.test(cells[0])) {
                continue;
            }

            const [
                rowNumber,
                airline,
                destinationCity,
                destinationCode,
                flightNumber,
                routeType,
                transitRoute,
                priceText,
            ] = cells;
            const route = normalizeRoute({
                routeType,
                transitRoute,
            });
            const parsedPrice = parsePrice(priceText);
            const trailingText = nullableCell(cells.slice(8).join(" "));
            const source = sourceByPageAndRow.get(
                `${parsedRow.pageNumber ?? ""}:${parsedRow.rowIndex}:${cleanCell(parsedRow.rawText)}`
            );
            const isPromo =
                Boolean(metadata.isPromo) || /promo/iu.test(trailingText ?? "");

            rows.push({
                airline: nullableCell(airline),
                commodity: metadata.commodity,
                confidence: 0.86,
                destinationCity: nullableCell(destinationCity),
                destinationCode: nullableCell(destinationCode),
                effectiveDate: metadata.effectiveDate,
                flightNumber: nullableCell(flightNumber),
                isPromo,
                originAirport: metadata.originAirport,
                originCity: metadata.originCity,
                pageNumber: parsedRow.pageNumber ?? table.pageNumber ?? null,
                priceStatus: priceStatusFromParsed(parsedPrice.status),
                rawEvidence: parsedRow.rawText,
                rawRowText: parsedRow.rawText,
                routeType: route.routeType,
                rowNumber: Number(rowNumber),
                schedule: isPromo ? null : trailingText,
                smuPricePerKg: parsedPrice.amount,
                sourceChunkId: null,
                sourceTableChunkId: source?.id ?? null,
                sourceText: parsedRow.rawText,
                transitRoute: route.transitRoute,
                validFrom: metadata.validFrom,
                validUntil: metadata.validUntil,
            });
        }
    }

    return rows;
}
