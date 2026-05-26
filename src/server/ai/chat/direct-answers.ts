import type { UIMessage } from "ai";

import type { ClassifiedIntent } from "#/server/ai/tools/classify-intent";
import { listDocumentInventory } from "#/server/retrieval/document-list";
import { searchTariffs } from "#/server/retrieval/structured-search";

const directAirlineAliases = [
    ["pelita", "Pelita Air"],
    ["lion", "Lion Air"],
    ["air asia", "Air Asia"],
    ["airasia", "Air Asia"],
] as const;

const directDestinationAliases = [
    ["surabaya", { city: "SURABAYA", code: "SUB" }],
    ["sub", { city: "SURABAYA", code: "SUB" }],
    ["makassar", { city: "UJUNG PANDANG", code: "UPG" }],
    ["upg", { city: "UJUNG PANDANG", code: "UPG" }],
    ["yogyakarta", { city: "YOGYAKARTA", code: "YIA" }],
    ["jogja", { city: "YOGYAKARTA", code: "YIA" }],
    ["yia", { city: "YOGYAKARTA", code: "YIA" }],
] as const;

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

function findDirectAirline(query: string) {
    const normalizedQuery = query.toLowerCase();
    return directAirlineAliases.find(([alias]) =>
        normalizedQuery.includes(alias)
    )?.[1];
}

function findDirectDestination(query: string) {
    const normalizedQuery = query.toLowerCase();
    return directDestinationAliases.find(([alias]) =>
        normalizedQuery.includes(alias)
    )?.[1];
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

    const destination = findDirectDestination(input.query);

    if (!destination) {
        return;
    }

    const airline = findDirectAirline(input.query);
    const rows = await searchTariffs({
        airline,
        destinationCode: destination.code,
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
            content: `Belum ada tarif aktif untuk ${airline ? `${airline} ke ` : ""}${destination.city}.`,
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
            `Tarif aktif ke ${destination.city}${airline ? ` untuk ${airline}` : ""}:`,
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
