import type { UIMessage } from "ai";

import type { TariffAnswerData } from "#/components/ai/types";
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
    metadata?: {
        tariffAnswer?: TariffAnswerData;
    };
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

function isTariffFollowUpQuery(query: string) {
    return /\b(kalau|kalo|untuk|tujuan|ke|destination|destinasi)\b/iu.test(
        query
    );
}

function isTariffComparisonQuery(query: string) {
    return /\b(selisih|beda|perbedaan|banding|bandingin|compare|comparison|difference|lebih\s+(mahal|murah))\b/iu.test(
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

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function getPreviousTariffAirline(messages: UIMessage[]) {
    const previousAssistant = messages
        .slice(0, -1)
        .findLast((message) => message.role === "assistant");
    const metadata = previousAssistant?.metadata;

    if (
        isRecord(metadata) &&
        isRecord(metadata.tariffAnswer) &&
        typeof metadata.tariffAnswer.airline === "string"
    ) {
        return metadata.tariffAnswer.airline;
    }

    const previousText = previousAssistant?.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("");
    const match = previousText?.match(/untuk\s+([^:\n]+)/iu);

    return match?.[1]?.trim();
}

function getPreviousTariffAnswers(messages: UIMessage[]) {
    return messages
        .slice(0, -1)
        .filter((message) => message.role === "assistant")
        .flatMap((message) => {
            const { metadata } = message;

            if (
                isRecord(metadata) &&
                isRecord(metadata.tariffAnswer) &&
                typeof metadata.tariffAnswer.destination === "string" &&
                Array.isArray(metadata.tariffAnswer.rows)
            ) {
                return [metadata.tariffAnswer as unknown as TariffAnswerData];
            }

            return [];
        });
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

function formatPriceRange(rows: Awaited<ReturnType<typeof searchTariffs>>) {
    const [lowestRow] = rows;
    const highestRow = rows.at(-1);

    if (!(lowestRow && highestRow)) {
        return "";
    }

    if (lowestRow.smuPricePerKg !== highestRow.smuPricePerKg) {
        return ` dari Rp ${lowestRow.smuPricePerKg?.toLocaleString("id-ID")}/kg sampai Rp ${highestRow.smuPricePerKg?.toLocaleString("id-ID")}/kg`;
    }

    return ` Rp ${lowestRow.smuPricePerKg?.toLocaleString("id-ID")}/kg`;
}

function toTariffAnswerRows(rows: Awaited<ReturnType<typeof searchTariffs>>) {
    return rows.map((row) => {
        const routeLabel =
            row.routeType === "TRANSIT" && row.transitRoute
                ? `${row.routeType} via ${row.transitRoute}`
                : row.routeType;

        return {
            airline: row.airline,
            destinationCity: row.destinationCity,
            destinationCode: row.destinationCode,
            documentId: row.documentId,
            isPromo: row.isPromo,
            originCity: row.originCity ?? "origin tidak tercatat",
            pageNumber: row.pageNumber,
            routeType: routeLabel,
            smuPricePerKg: row.smuPricePerKg ?? 0,
            transitRoute: row.transitRoute,
        };
    });
}

function getTariffPriceBounds(answer: TariffAnswerData) {
    const prices = answer.rows
        .map((row) => row.smuPricePerKg)
        .filter((price) => Number.isFinite(price))
        .toSorted((left, right) => left - right);
    const min = prices.at(0);
    const max = prices.at(-1);

    if (!(min && max)) {
        return;
    }

    return { max, min };
}

function formatCurrencyDelta(value: number) {
    return `Rp ${Math.abs(value).toLocaleString("id-ID")}/kg`;
}

function describeMoreExpensive(input: {
    delta: number;
    left: TariffAnswerData;
    right: TariffAnswerData;
}) {
    if (input.delta === 0) {
        return "keduanya sama pada harga termurah.";
    }

    const higher =
        input.delta > 0 ? input.left.destination : input.right.destination;

    return `${higher} lebih mahal ${formatCurrencyDelta(input.delta)} pada harga termurah.`;
}

function getTariffComparisonAnswer(input: {
    intent: ClassifiedIntent;
    messages: UIMessage[];
    query: string;
}): DirectChatAnswer | undefined {
    if (!isTariffComparisonQuery(input.query)) {
        return;
    }

    const previousAnswers = getPreviousTariffAnswers(input.messages);
    const [right, left] = previousAnswers.slice(-2).toReversed();

    if (!(left && right)) {
        return;
    }

    const leftBounds = getTariffPriceBounds(left);
    const rightBounds = getTariffPriceBounds(right);

    if (!(leftBounds && rightBounds)) {
        return;
    }

    const minDelta = leftBounds.min - rightBounds.min;
    const maxDelta = leftBounds.max - rightBounds.max;
    const airline = left.airline ?? right.airline;
    const contextLabel = airline ? ` untuk ${airline}` : "";

    return {
        content: `Selisih tarif ${left.destination} dan ${right.destination}${contextLabel}: ${describeMoreExpensive({ delta: minDelta, left, right })} Harga termurah ${left.destination} adalah Rp ${leftBounds.min.toLocaleString("id-ID")}/kg, sedangkan ${right.destination} Rp ${rightBounds.min.toLocaleString("id-ID")}/kg. Jika memakai harga tertinggi dari masing-masing daftar, selisihnya ${formatCurrencyDelta(maxDelta)}.`,
        evidenceSnippets: [
            `${left.destination}: ${left.rows
                .map((row) => row.smuPricePerKg)
                .join(", ")}`,
            `${right.destination}: ${right.rows
                .map((row) => row.smuPricePerKg)
                .join(", ")}`,
        ],
        intent: input.intent,
        mode: "verified_numeric",
        stage: "direct:tariff-comparison",
        status: "Comparing tariff answers",
    };
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
    messages: UIMessage[];
    query: string;
}): Promise<DirectChatAnswer | undefined> {
    const destination = await findDirectDestination(input.query);

    if (!destination) {
        return;
    }

    const previousAirline = getPreviousTariffAirline(input.messages);
    const airline = (await findDirectAirline(input.query)) ?? previousAirline;

    if (
        !(
            isTariffPriceQuery(input.query) ||
            (airline && isTariffFollowUpQuery(input.query))
        )
    ) {
        return;
    }

    const rowsByCode = destination.code
        ? await searchTariffs({
              airline,
              destinationCode: destination.code,
          })
        : [];
    const tariffRows =
        rowsByCode.length > 0 || !destination.city
            ? rowsByCode
            : await searchTariffs({
                  airline,
                  destinationCity: destination.city,
              });
    const pricedRows = tariffRows
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

    const range = formatPriceRange(pricedRows);
    const tariffAnswerRows = toTariffAnswerRows(pricedRows);
    const destinationLabel =
        destination.city ?? destination.code ?? "tujuan ini";

    return {
        content: `Tarif aktif${airline ? ` ${airline}` : ""} ke ${destinationLabel} tersedia${range}. Saya menemukan ${pricedRows.length} baris aktif yang sudah direview; detailnya saya tampilkan di bawah.`,
        evidenceSnippets: pricedRows.flatMap((row) =>
            [row.rawRowText, row.sourceText].filter(isNonEmptyString)
        ),
        intent: input.intent,
        metadata: {
            tariffAnswer: {
                airline,
                destination: destinationLabel,
                rows: tariffAnswerRows,
            },
        },
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
        getTariffComparisonAnswer({
            intent: input.intent,
            messages: input.messages,
            query: input.query,
        }) ??
        (await getTariffPriceAnswer({
            intent: input.intent,
            messages: input.messages,
            query: input.query,
        }))
    );
}
