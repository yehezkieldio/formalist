import type { TariffAnswerData } from "#/components/ai/types";
import type { AssistantToolEvent } from "#/server/ai/tools";

interface SuccessfulToolEvent {
    error?: string;
    input: unknown;
    output?: unknown;
    state: "success";
    toolName: string;
}

function isSuccessfulToolEvent(
    event: AssistantToolEvent
): event is SuccessfulToolEvent {
    return event.state === "success" && "output" in event;
}

const nonAnswerPatterns = [
    /\b(let me|i will|i'll|saya akan|aku akan|sebentar|cari dulu|get more details|fetch more)\b/iu,
    /\busing (the )?(documents|tools|search)\b/iu,
] as const;

function formatScalar(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return;
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }
}

function summarizeRecord(record: Record<string, unknown>) {
    const label =
        formatScalar(record.title) ??
        formatScalar(record.filename) ??
        formatScalar(record.destinationCity) ??
        formatScalar(record.destinationCode) ??
        formatScalar(record.name) ??
        "result";
    const details = [
        ["airline", record.airline],
        ["origin", record.originCity ?? record.originCode],
        ["destination", record.destinationCity ?? record.destinationCode],
        ["route", record.routeType],
        ["value", record.valueNumber ?? record.price ?? record.smuPricePerKg],
        ["confidence", record.confidence ?? record.confidenceState],
    ]
        .map(([labelKey, value]) => {
            const formatted = formatScalar(value);
            return formatted ? `${labelKey}: ${formatted}` : undefined;
        })
        .filter(Boolean);

    return details.length > 0 ? `${label} (${details.join(", ")})` : label;
}

function getRecordArrayCount(record: Record<string, unknown>) {
    if (Array.isArray(record.results)) {
        return record.results.length;
    }

    if (Array.isArray(record.rows)) {
        return record.rows.length;
    }

    if (Array.isArray(record.items)) {
        return record.items.length;
    }
}

function summarizeToolOutput(value: unknown): string[] {
    if (!value) {
        return [];
    }

    if (typeof value === "string") {
        return value.trim() ? [value.trim()] : [];
    }

    if (Array.isArray(value)) {
        return value.slice(0, 8).map((item, index) => {
            if (typeof item === "string") {
                return `${index + 1}. ${item}`;
            }

            if (typeof item === "object" && item) {
                return `${index + 1}. ${summarizeRecord(item as Record<string, unknown>)}`;
            }

            return `${index + 1}. ${String(item)}`;
        });
    }

    if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        const count = getRecordArrayCount(record);

        if (count !== undefined) {
            return [`Returned ${count} result${count === 1 ? "" : "s"}.`];
        }

        return [summarizeRecord(record)];
    }

    return [String(value)];
}

function getRecordValue(record: Record<string, unknown>, key: string) {
    const value = record[key];
    return value === null || value === undefined ? undefined : value;
}

function getTariffRowsFromOutput(output: unknown): Record<string, unknown>[] {
    if (Array.isArray(output)) {
        return output.filter(
            (item): item is Record<string, unknown> =>
                Boolean(item) &&
                typeof item === "object" &&
                "smuPricePerKg" in item
        );
    }

    if (!output || typeof output !== "object") {
        return [];
    }

    const record = output as Record<string, unknown>;

    if (Array.isArray(record.rows)) {
        return getTariffRowsFromOutput(record.rows);
    }

    if (Array.isArray(record.results)) {
        return getTariffRowsFromOutput(record.results);
    }

    return [];
}

function formatPrice(value: unknown) {
    if (typeof value === "number") {
        return value.toLocaleString("id-ID");
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString("id-ID") : null;
}

function buildTariffAnswerData(
    toolEvents: SuccessfulToolEvent[]
): TariffAnswerData | undefined {
    const rows = toolEvents
        .filter((event) => event.toolName === "searchTariffs")
        .flatMap((event) => getTariffRowsFromOutput(event.output))
        .filter((row) => getRecordValue(row, "smuPricePerKg") !== undefined)
        .toSorted((left, right) => {
            const leftPrice = Number(getRecordValue(left, "smuPricePerKg"));
            const rightPrice = Number(getRecordValue(right, "smuPricePerKg"));
            return leftPrice - rightPrice;
        })
        .slice(0, 8);

    if (rows.length === 0) {
        return;
    }

    const destination =
        getRecordValue(rows[0], "destinationCity") ??
        getRecordValue(rows[0], "destinationCode") ??
        "tujuan tersebut";
    const airline = getRecordValue(rows[0], "airline");
    const answerRows = rows.map((row) => {
        const routeType = getRecordValue(row, "routeType");
        const transitRoute = getRecordValue(row, "transitRoute");
        let routeLabel = "route tidak tercatat";

        if (routeType === "TRANSIT" && transitRoute) {
            routeLabel = `${String(routeType)} via ${String(transitRoute)}`;
        } else if (routeType) {
            routeLabel = String(routeType);
        }

        return {
            airline: formatScalar(getRecordValue(row, "airline")),
            destinationCity: formatScalar(
                getRecordValue(row, "destinationCity")
            ),
            destinationCode: formatScalar(
                getRecordValue(row, "destinationCode")
            ),
            documentId: String(getRecordValue(row, "documentId") ?? "unknown"),
            isPromo: Boolean(getRecordValue(row, "isPromo")),
            originCity:
                formatScalar(getRecordValue(row, "originCity")) ??
                "origin tidak tercatat",
            pageNumber:
                typeof getRecordValue(row, "pageNumber") === "number"
                    ? (getRecordValue(row, "pageNumber") as number)
                    : null,
            routeType: routeLabel,
            smuPricePerKg: Number(getRecordValue(row, "smuPricePerKg")),
            transitRoute: formatScalar(getRecordValue(row, "transitRoute")),
        };
    });

    return {
        airline: formatScalar(airline),
        destination: String(destination),
        rows: answerRows,
    };
}

function formatTariffAnswer(data: TariffAnswerData) {
    const prices = data.rows
        .map((row) => row.smuPricePerKg)
        .filter((price) => Number.isFinite(price))
        .toSorted((left, right) => left - right);
    const [lowest] = prices;
    const highest = prices.at(-1);

    if (lowest === undefined || highest === undefined) {
        return `Saya menemukan baris tarif aktif untuk ${data.airline ? `${data.airline} ke ` : ""}${data.destination}, tetapi harga belum terbaca dengan aman.`;
    }

    const range =
        lowest === highest
            ? `Rp ${formatPrice(lowest)}/kg`
            : `Rp ${formatPrice(lowest)}/kg sampai Rp ${formatPrice(highest)}/kg`;

    return `Tarif aktif${data.airline ? ` ${data.airline}` : ""} ke ${data.destination} tersedia ${range}. Saya menemukan ${data.rows.length} baris aktif yang sudah direview; detailnya saya tampilkan di bawah.`;
}

export function needsFinalAnswerRepair(input: {
    text: string;
    toolEvents: AssistantToolEvent[];
}) {
    const trimmed = input.text.trim();

    if (input.toolEvents.length === 0) {
        return false;
    }

    return (
        trimmed.length < 80 ||
        nonAnswerPatterns.some((pattern) => pattern.test(trimmed))
    );
}

export function buildToolResultFallback(toolEvents: AssistantToolEvent[]) {
    const successfulEvents = toolEvents.filter(isSuccessfulToolEvent);

    if (successfulEvents.length === 0) {
        return "Saya menjalankan pencarian, tetapi belum ada hasil yang cukup untuk membuat jawaban tepercaya. Coba persempit pertanyaan atau pastikan data sudah direview.";
    }

    const tariffAnswerData = buildTariffAnswerData(successfulEvents);

    if (tariffAnswerData) {
        return formatTariffAnswer(tariffAnswerData);
    }

    const lines = successfulEvents.flatMap((event) => {
        if (
            event.toolName === "classifyIntent" ||
            event.toolName === "resolveAliases"
        ) {
            return [];
        }

        const summary = summarizeToolOutput(event.output);

        if (summary.length === 0) {
            return [];
        }

        return [`${event.toolName}:`, ...summary];
    });

    if (lines.length === 0) {
        return "Pencarian selesai, tetapi tidak ada hasil terstruktur yang cukup untuk dijadikan jawaban tepercaya.";
    }

    return "Saya menemukan hasil retrieval, tetapi belum ada jawaban akhir yang aman dari data aktif yang sudah direview. Saya tidak akan menampilkan payload tool mentah sebagai jawaban.";
}

export function buildToolResultFallbackMetadata(
    toolEvents: AssistantToolEvent[]
) {
    const tariffAnswer = buildTariffAnswerData(
        toolEvents.filter(isSuccessfulToolEvent)
    );

    return tariffAnswer ? { tariffAnswer } : undefined;
}
