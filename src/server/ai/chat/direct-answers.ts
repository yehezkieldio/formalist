import type { UIMessage } from "ai";

import type { ClassifiedIntent } from "#/server/ai/tools/classify-intent";
import { findAliasesByType } from "#/server/db/queries/aliases";
import type { AliasType } from "#/server/db/schema";
import type { AliasRecord } from "#/server/retrieval/aliases";
import { builtInAliases } from "#/server/retrieval/built-in-aliases";
import { listDocumentInventory } from "#/server/retrieval/document-list";
import { searchTariffs } from "#/server/retrieval/structured-search";

export interface DirectChatAnswer {
    content: string;
    evidenceSnippets: string[];
    intent: ClassifiedIntent;
    mode: "general_rag" | "verified_numeric";
    stage: string;
    status: string;
}

function isDocumentInventoryQuery(query: string) {
    return /\b(list|show|lihat|tampil|daftar|documents?|dokumen|files?|uploads?|sources?|memories)\b/iu.test(
        query
    );
}

function isTariffPriceQuery(query: string) {
    return /\b(harga|price|tariff|tarif|smu|ongkir|rate|berapa)\b/iu.test(
        query
    );
}

function escapeRegExp(value: string) {
    return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function normalizeText(value: string) {
    return value.trim().toLowerCase().replaceAll(/\s+/gu, " ");
}

function containsAlias(query: string, alias: string) {
    const normalizedAlias = normalizeText(alias);

    if (!normalizedAlias) {
        return false;
    }

    return new RegExp(
        `(^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedAlias)}($|[^\\p{L}\\p{N}])`,
        "iu"
    ).test(normalizeText(query));
}

async function getAliasRecords(type: AliasType) {
    const storedAliases = await findAliasesByType(type);
    const fallbackAliases = builtInAliases.filter(
        (alias) => alias.type === type
    );

    return [...storedAliases, ...fallbackAliases];
}

async function resolveAliasInQuery(input: {
    query: string;
    type: AliasType;
}): Promise<AliasRecord | undefined> {
    const records = await getAliasRecords(input.type);
    const directMatches = records
        .filter(
            (record) =>
                containsAlias(input.query, record.alias) ||
                containsAlias(input.query, record.canonicalValue)
        )
        .toSorted((left, right) => right.alias.length - left.alias.length);
    const [directMatch] = directMatches;

    if (directMatch && !directMatch.isAmbiguous) {
        return directMatch;
    }
}

async function findDirectAirline(query: string) {
    const alias = await resolveAliasInQuery({ query, type: "airline" });

    return alias?.canonicalValue;
}

function getMetadataStringArray(record: AliasRecord, key: string) {
    const { metadata } = record;

    if (!metadata || typeof metadata !== "object") {
        return [];
    }

    const value = (metadata as Record<string, unknown>)[key];

    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}

async function findDirectDestination(query: string) {
    const airport = await resolveAliasInQuery({ query, type: "airport" });

    if (airport) {
        return {
            city:
                typeof airport.metadata === "object" &&
                airport.metadata &&
                typeof (airport.metadata as Record<string, unknown>).city ===
                    "string"
                    ? ((airport.metadata as Record<string, unknown>)
                          .city as string)
                    : undefined,
            code: airport.canonicalValue,
        };
    }

    const city = await resolveAliasInQuery({ query, type: "city" });

    if (!city) {
        return;
    }

    return {
        city: city.canonicalValue,
        code: getMetadataStringArray(city, "airportCodes")[0],
    };
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function formatDocumentInventory(
    rows: Awaited<ReturnType<typeof listDocumentInventory>>
) {
    if (rows.length === 0) {
        return "Belum ada dokumen yang tersimpan.";
    }

    const lines = rows.map((document, index) => {
        const label = document.sourceName ?? document.filename;
        return `${index + 1}. ${label} - ${document.status}, ${document.reviewCount} reviewed records, ${document.issueCount} issues`;
    });

    return [`Ada ${rows.length} dokumen:`, ...lines].join("\n");
}

async function getDocumentInventoryAnswer(input: {
    intent: ClassifiedIntent;
    mode: "general_rag" | "verified_numeric";
    query: string;
}): Promise<DirectChatAnswer | undefined> {
    if (!isDocumentInventoryQuery(input.query)) {
        return;
    }

    const documents = await listDocumentInventory({ limit: 50 });

    return {
        content: formatDocumentInventory(documents),
        evidenceSnippets: documents.map((document) => document.filename),
        intent: input.intent,
        mode: input.mode,
        stage: "direct:document-inventory",
        status: "Listing documents",
    };
}

async function getTariffPriceAnswer(input: {
    intent: ClassifiedIntent;
    query: string;
}): Promise<DirectChatAnswer | undefined> {
    if (!isTariffPriceQuery(input.query)) {
        return;
    }

    const destination = await findDirectDestination(input.query);

    if (!destination) {
        return;
    }

    const airline = await findDirectAirline(input.query);
    const rowsByCode = destination.code
        ? await searchTariffs({
              airline,
              destinationCode: destination.code,
          })
        : [];
    const rows =
        rowsByCode.length > 0 || !destination.city
            ? rowsByCode
            : await searchTariffs({
                  airline,
                  destinationCity: destination.city,
              });
    const pricedRows = rows
        .filter((row) => row.smuPricePerKg !== null)
        .toSorted((left, right) => {
            const priceDelta =
                (left.smuPricePerKg ?? Number.MAX_SAFE_INTEGER) -
                (right.smuPricePerKg ?? Number.MAX_SAFE_INTEGER);

            if (priceDelta !== 0) {
                return priceDelta;
            }

            return Number(right.isPromo) - Number(left.isPromo);
        })
        .slice(0, 8);

    if (pricedRows.length === 0) {
        return {
            content: `Belum ada tarif aktif yang sudah direview untuk ${airline ? `${airline} ke ` : ""}${destination.city ?? destination.code}.`,
            evidenceSnippets: [],
            intent: input.intent,
            mode: "verified_numeric",
            stage: "direct:tariff-answer",
            status: "Checking active tariffs",
        };
    }

    const lines = pricedRows.map((row, index) => {
        const promoLabel = row.isPromo ? "promo" : "regular";
        const routeLabel =
            row.routeType === "TRANSIT" && row.transitRoute
                ? `${row.routeType} via ${row.transitRoute}`
                : row.routeType;

        return `${index + 1}. ${row.airline ?? "Unknown airline"} ${row.originCity ?? "Unknown origin"} -> ${row.destinationCity ?? destination.city}: Rp ${row.smuPricePerKg?.toLocaleString("id-ID")}/kg (${promoLabel}, ${routeLabel}, doc ${row.documentId}${row.pageNumber ? ` page ${row.pageNumber}` : ""})`;
    });

    return {
        content: [
            `Tarif aktif ke ${destination.city ?? destination.code}${airline ? ` untuk ${airline}` : ""}:`,
            ...lines,
        ].join("\n"),
        evidenceSnippets: pricedRows.flatMap((row) =>
            [row.rawRowText, row.sourceText].filter(isNonEmptyString)
        ),
        intent: input.intent,
        mode: "verified_numeric",
        stage: "direct:tariff-answer",
        status: "Checking active tariffs",
    };
}

export async function getDirectChatAnswer(input: {
    intent: ClassifiedIntent;
    messages: UIMessage[];
    mode: "general_rag" | "verified_numeric";
    query: string;
}) {
    return (
        (await getDocumentInventoryAnswer(input)) ??
        (await getTariffPriceAnswer({
            intent: input.intent,
            query: input.query,
        }))
    );
}
