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
                const record = item as Record<string, unknown>;
                const title =
                    record.title ??
                    record.filename ??
                    record.destinationCity ??
                    record.destinationCode ??
                    record.toolName ??
                    "result";
                const price =
                    record.smuPricePerKg ??
                    record.valueNumber ??
                    record.price ??
                    undefined;
                return `${index + 1}. ${String(title)}${price ? ` - ${String(price)}` : ""}`;
            }

            return `${index + 1}. ${String(item)}`;
        });
    }

    if (typeof value === "object") {
        return [JSON.stringify(value).slice(0, 500)];
    }

    return [String(value)];
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
        return "I ran the retrieval tools, but they did not return a usable result. Please try a narrower question.";
    }

    const lines = successfulEvents.flatMap((event) => {
        const summary = summarizeToolOutput(event.output);

        if (summary.length === 0) {
            return [];
        }

        return [`${event.toolName}:`, ...summary];
    });

    if (lines.length === 0) {
        return "The tools completed, but no readable answer payload was returned.";
    }

    return ["Tool results:", ...lines].join("\n");
}
