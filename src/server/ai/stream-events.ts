const secretKeyPattern =
    /(api[_-]?key|authorization|bearer|cookie|password|secret|session|token)/iu;

export interface SerializedToolCall {
    input?: unknown;
    output?: unknown;
    sourceIds: string[];
    summary: string;
    toolName: string;
}

export function redactSecrets(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => redactSecrets(item));
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
        output[key] = secretKeyPattern.test(key)
            ? "[REDACTED]"
            : redactSecrets(nestedValue);
    }

    return output;
}

export function collectSourceIds(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.flatMap((item) => collectSourceIds(item));
    }

    if (!value || typeof value !== "object") {
        return [];
    }

    const sourceIds: string[] = [];

    for (const [key, nestedValue] of Object.entries(value)) {
        if (
            (key === "sourceId" || key === "source_id" || key === "id") &&
            typeof nestedValue === "string"
        ) {
            sourceIds.push(nestedValue);
        }

        sourceIds.push(...collectSourceIds(nestedValue));
    }

    return sourceIds;
}

function getResultCount(output: unknown) {
    if (Array.isArray(output)) {
        return output.length;
    }

    if (!output || typeof output !== "object") {
        return null;
    }

    if ("results" in output && Array.isArray(output.results)) {
        return output.results.length;
    }

    if ("rows" in output && Array.isArray(output.rows)) {
        return output.rows.length;
    }

    if ("items" in output && Array.isArray(output.items)) {
        return output.items.length;
    }

    return null;
}

function summarizeToolCall(toolName: string, output: unknown) {
    const count = getResultCount(output);

    if (count !== null) {
        return `${toolName} returned ${count} result${count === 1 ? "" : "s"}`;
    }

    if (output && typeof output === "object" && "confidenceState" in output) {
        return `${toolName} produced a verification state`;
    }

    return `${toolName} completed`;
}

export function serializeToolCallForStream(input: {
    input?: unknown;
    output?: unknown;
    toolName: string;
}): SerializedToolCall {
    const safeInput = redactSecrets(input.input);
    const safeOutput = redactSecrets(input.output);
    const sourceIds = [
        ...collectSourceIds(safeInput),
        ...collectSourceIds(safeOutput),
    ];

    return {
        input: safeInput,
        output: safeOutput,
        sourceIds: [...new Set(sourceIds)],
        summary: summarizeToolCall(input.toolName, safeOutput),
        toolName: input.toolName,
    };
}
