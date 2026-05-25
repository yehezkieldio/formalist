import * as z from "zod";

import { chatSourceTypes } from "#/server/db/schema";

export const intentSchema = z.enum([
    "admin_status",
    "general_rag",
    "quote",
    "source_lookup",
    "unanswerable",
    "verified_numeric",
]);

export const classifyIntentInputSchema = z.object({
    query: z.string().min(1),
});

export const retrievalInputSchema = z.object({
    documentId: z.uuid().optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
    limit: z.number().int().positive().max(20).optional(),
    query: z.string().min(1),
});

export const aliasInputSchema = z.object({
    query: z.string().min(1),
    type: z.enum(["airline", "airport", "city", "destination", "route"]),
});

export const factSearchInputSchema = z.object({
    airline: z.string().optional(),
    destinationCity: z.string().optional(),
    destinationCode: z.string().optional(),
    factType: z
        .enum([
            "destination",
            "document_metadata",
            "fee_rule",
            "minimum_weight",
            "other",
            "ppn",
            "route",
            "schedule",
            "surcharge",
            "tariff_price",
            "validity_rule",
        ])
        .optional(),
    status: z
        .enum(["active", "archived", "extracted", "needs_review", "rejected"])
        .optional(),
});

export const tariffSearchInputSchema = z.object({
    airline: z.string().optional(),
    destinationCity: z.string().optional(),
    destinationCode: z.string().optional(),
    isPromo: z.boolean().optional(),
    originAirport: z.string().optional(),
    originCity: z.string().optional(),
    routeType: z.enum(["ANY", "DIRECT", "TRANSIT", "UNKNOWN"]).optional(),
    status: z
        .enum(["active", "archived", "extracted", "needs_review", "rejected"])
        .optional(),
});

export const feeRuleInputSchema = z.object({
    airline: z.string().optional(),
    documentId: z.uuid().optional(),
});

export const sourceEvidenceInputSchema = z.object({
    sourceId: z.uuid(),
    sourceType: z.enum(chatSourceTypes),
});

export const compareTariffsInputSchema = tariffSearchInputSchema.extend({
    mode: z
        .enum(["cheapest", "latest", "promo", "regular", "unspecified"])
        .optional(),
});

export const ambiguityInputSchema = z.object({
    field: z.enum(["date", "promo", "route"]).optional(),
    query: z.string().min(1),
    type: z
        .enum(["airline", "airport", "city", "destination", "route"])
        .optional(),
});

export const verifyAnswerInputSchema = z.object({
    draftText: z.string().optional(),
    evidenceSnippets: z.array(z.string()).optional(),
    mode: z.enum(["general_rag", "verified_numeric"]),
    sourceCount: z.number().int().nonnegative(),
    trustedSourceCount: z.number().int().nonnegative(),
    warnings: z.array(z.string()).optional(),
});
