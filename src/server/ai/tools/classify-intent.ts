import { generateText, Output } from "ai";
import { z } from "zod";

import { env } from "#/env";
import { getModelConfiguration } from "#/server/ai/models";
import { getOpenRouterProvider } from "#/server/ai/provider";
import type { classifyIntentInputSchema } from "#/server/ai/tool-schemas";

const numericIntentPattern =
    /\b(harga|price|fee|biaya|total|quote|valid|validity|schedule|jadwal|route|rute|direct|transit|promo|regular|murah|kg|kilogram|ppn|surcharge)\b/iu;
const quoteIntentPattern = /\b(total|quote|kg|kilogram|berapa semua)\b/iu;
const sourceIntentPattern = /\b(source|sumber|file|halaman|page)\b/iu;
const adminIntentPattern =
    /\b(admin|operator|ingestion|upload|issue|extraction|approve|reject|archive|activate|active document|dokumen aktif|baris.*review|perlu review)\b/iu;

export type ClassifiedIntent =
    | "admin_status"
    | "general_rag"
    | "quote"
    | "source_lookup"
    | "unanswerable"
    | "verified_numeric";

const intentSchema = z.object({
    intent: z.enum([
        "admin_status",
        "general_rag",
        "quote",
        "source_lookup",
        "unanswerable",
        "verified_numeric",
    ]),
});

export function classifyIntentFallback(
    input: z.infer<typeof classifyIntentInputSchema>
): ClassifiedIntent {
    const query = input.query.trim();

    if (!query) {
        return "unanswerable";
    }

    if (quoteIntentPattern.test(query)) {
        return "quote";
    }

    if (numericIntentPattern.test(query)) {
        return "verified_numeric";
    }

    if (sourceIntentPattern.test(query)) {
        return "source_lookup";
    }

    if (adminIntentPattern.test(query)) {
        return "admin_status";
    }

    return "general_rag";
}

export async function classifyIntent(
    input: z.infer<typeof classifyIntentInputSchema>
): Promise<ClassifiedIntent> {
    const provider = getOpenRouterProvider();
    const query = input.query.trim();

    if (
        !query ||
        provider.status === "setup-required" ||
        env.NODE_ENV === "test"
    ) {
        return classifyIntentFallback(input);
    }

    try {
        const { classifierModel } = getModelConfiguration();
        const result = await generateText({
            maxOutputTokens: 80,
            model: provider.openrouter.chat(classifierModel),
            output: Output.object({ schema: intentSchema }),
            prompt: `Classify this Formalist air-cargo assistant query: ${query}`,
            system: [
                "Return only the most appropriate intent.",
                "Use verified_numeric for prices, fees, schedules, validity, routes, destination availability, promo/regular comparison, and tariff facts.",
                "Use quote when a total shipment cost or weight-based calculation is requested.",
                "Use source_lookup when the user asks where evidence came from.",
                "Use admin_status only for Formalist admin/ingestion/review workflow questions, not for unrelated HR or policy reviews.",
                "Use general_rag for summaries, definitions, policy explanations, and ordinary document Q&A.",
            ].join("\n"),
        });

        return result.output.intent;
    } catch {
        return classifyIntentFallback(input);
    }
}
