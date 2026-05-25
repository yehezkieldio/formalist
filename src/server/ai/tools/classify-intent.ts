import type * as z from "zod";

import type { classifyIntentInputSchema } from "#/server/ai/tool-schemas";

const numericIntentPattern =
    /\b(harga|price|fee|biaya|total|quote|valid|validity|schedule|jadwal|route|rute|direct|transit|promo|regular|murah|kg|kilogram|ppn|surcharge)\b/iu;
const quoteIntentPattern = /\b(total|quote|kg|kilogram|berapa semua)\b/iu;
const sourceIntentPattern = /\b(source|sumber|file|halaman|page)\b/iu;
const adminIntentPattern =
    /\b(review|active|aktif|status|ingestion|upload|issue)\b/iu;

export type ClassifiedIntent =
    | "admin_status"
    | "general_rag"
    | "quote"
    | "source_lookup"
    | "unanswerable"
    | "verified_numeric";

export function classifyIntent(
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
