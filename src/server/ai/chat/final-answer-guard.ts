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

export function buildToolResultFallbackMetadata(
    toolEvents: AssistantToolEvent[]
) {
    const tariffAnswer = buildTariffAnswerData(
        toolEvents.filter(isSuccessfulToolEvent)
    );

    return tariffAnswer ? { tariffAnswer } : undefined;
}

const preservedOutputKeys = new Set([
    "airline",
    "city",
    "code",
    "confidence",
    "confidenceState",
    "destination",
    "destinationCity",
    "destinationCode",
    "documentId",
    "filename",
    "isAmbiguous",
    "isPromo",
    "metadata",
    "origin",
    "originAirport",
    "originCity",
    "pageNumber",
    "price",
    "rawRowText",
    "resolved",
    "routeType",
    "rowText",
    "score",
    "smuPricePerKg",
    "snippet",
    "sourceId",
    "sourceName",
    "sourceText",
    "sourceType",
    "status",
    "title",
    "transitRoute",
    "validFrom",
    "validUntil",
    "valueNumber",
]);

function sanitizeToolValue(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint"
    ) {
        return value;
    }

    if (typeof value === "string") {
        return value.length > 600 ? `${value.slice(0, 600)}...` : value;
    }

    if (depth > 3) {
        return "[truncated]";
    }

    if (Array.isArray(value)) {
        return value
            .slice(0, 12)
            .map((item) => sanitizeToolValue(item, depth + 1));
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(
                ([key]) =>
                    preservedOutputKeys.has(key) ||
                    key === "rows" ||
                    key === "results" ||
                    key === "items" ||
                    key === "candidates"
            )
            .slice(0, 24)
            .map(([key, nestedValue]) => [
                key,
                sanitizeToolValue(nestedValue, depth + 1),
            ]);

        return Object.fromEntries(entries);
    }

    return String(value);
}

export function buildRepairEvidence(input: {
    originalAnswer: string;
    query: string;
    toolEvents: AssistantToolEvent[];
}) {
    return {
        originalAnswer: input.originalAnswer.slice(0, 1200),
        query: input.query,
        toolEvents: input.toolEvents
            .filter((event) => event.state !== "running")
            .map((event) => ({
                error: "error" in event ? event.error : undefined,
                input: sanitizeToolValue(event.input),
                output:
                    "output" in event
                        ? sanitizeToolValue(event.output)
                        : undefined,
                state: event.state,
                toolName: event.toolName,
            })),
    };
}
