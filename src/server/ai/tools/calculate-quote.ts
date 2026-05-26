import * as z from "zod";

import { calculateQuote } from "#/server/tariff/calculator";

export const calculateQuoteInputSchema = z.object({
    feeRule: z.unknown().nullable(),
    surcharge: z.number().optional(),
    tariffRow: z.unknown(),
    weightKg: z.number().positive(),
});

export function calculateQuoteTool(
    input: z.infer<typeof calculateQuoteInputSchema>
) {
    const result = calculateQuote({
        feeRule: input.feeRule as Parameters<
            typeof calculateQuote
        >[0]["feeRule"],
        surcharge: input.surcharge,
        tariffRow: input.tariffRow as Parameters<
            typeof calculateQuote
        >[0]["tariffRow"],
        weightKg: input.weightKg,
    });

    return {
        confidenceState:
            result.warnings.length > 0 ? "NEEDS_CONFIRMATION" : "CONFIDENT",
        result,
    };
}
