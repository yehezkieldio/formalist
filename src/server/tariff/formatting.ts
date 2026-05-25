import type { QuoteResult } from "./calculator";

export function formatQuoteLines(result: QuoteResult) {
    return [
        `Billable weight: ${result.billableWeightKg} kg`,
        ...result.lines.map((line) => `${line.label}: IDR ${line.amount}`),
        `Total: IDR ${result.total}`,
        ...result.warnings.map((warning) => `Warning: ${warning}`),
    ];
}
