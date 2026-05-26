import * as z from "zod";

import { factTypes, priceStatuses, routeTypes } from "#/server/db/schema";

const nullableString = z.string().trim().min(1).nullable();
const nullableNumber = z.number().nullable();
const nullableBoolean = z.boolean().nullable();
const nullableDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u)
    .nullable();
const confidence = z.number().min(0).max(1).nullable();

export const sourceReferenceSchema = z.object({
    rawEvidence: z.string().trim().min(1),
    sourceChunkId: z.string().uuid().nullable(),
    sourceTableChunkId: z.string().uuid().nullable(),
});

export const documentMetadataExtractionSchema = z.object({
    airline: nullableString,
    commodity: nullableString,
    confidence,
    effectiveDate: nullableDate,
    isPromo: nullableBoolean,
    originAirport: nullableString,
    originCity: nullableString,
    validFrom: nullableDate,
    validUntil: nullableDate,
});

export const extractedFactSchema = sourceReferenceSchema.extend({
    airline: nullableString,
    confidence,
    currency: nullableString,
    destinationCity: nullableString,
    destinationCode: nullableString,
    effectiveDate: nullableDate,
    factType: z.enum(factTypes),
    flightNumber: nullableString,
    isPromo: nullableBoolean,
    originAirport: nullableString,
    originCity: nullableString,
    predicate: nullableString,
    routeType: nullableString,
    schedule: nullableString,
    subject: nullableString,
    transitRoute: nullableString,
    unit: nullableString,
    validFrom: nullableDate,
    validUntil: nullableDate,
    valueNumber: nullableNumber,
    valueText: nullableString,
});

export const tariffRowExtractionSchema = sourceReferenceSchema.extend({
    airline: nullableString,
    commodity: nullableString,
    confidence,
    destinationCity: nullableString,
    destinationCode: nullableString,
    effectiveDate: nullableDate,
    flightNumber: nullableString,
    isPromo: z.boolean().default(false),
    originAirport: nullableString,
    originCity: nullableString,
    pageNumber: z.number().int().positive().nullable(),
    priceStatus: z.enum(priceStatuses),
    rawRowText: nullableString,
    routeType: z.enum(routeTypes),
    rowNumber: z.number().int().nonnegative().nullable(),
    schedule: nullableString,
    smuPricePerKg: z.number().int().nonnegative().nullable(),
    sourceText: nullableString,
    transitRoute: nullableString,
    validFrom: nullableDate,
    validUntil: nullableDate,
});

export const feeRuleExtractionSchema = sourceReferenceSchema.extend({
    adminFeePerSmu: z.number().int().nonnegative().nullable(),
    airline: nullableString,
    dgSurcharge: z.number().int().nonnegative().nullable(),
    minWeightKg: nullableNumber,
    notes: nullableString,
    ppnPercent: nullableNumber,
    quarantineNote: nullableString,
    shipdecNote: nullableString,
    warehouseAdminPerSmu: z.number().int().nonnegative().nullable(),
    warehouseFeePerKg: z.number().int().nonnegative().nullable(),
});

export const structuredExtractionSchema = z.object({
    documentMetadata: documentMetadataExtractionSchema,
    facts: z.array(extractedFactSchema),
    feeRules: z.array(feeRuleExtractionSchema),
    tariffRows: z.array(tariffRowExtractionSchema),
});

export type DocumentMetadataExtraction = z.infer<
    typeof documentMetadataExtractionSchema
>;
export type ExtractedFactExtraction = z.infer<typeof extractedFactSchema>;
export type TariffRowExtraction = z.infer<typeof tariffRowExtractionSchema>;
export type FeeRuleExtraction = z.infer<typeof feeRuleExtractionSchema>;
export type StructuredExtraction = z.infer<typeof structuredExtractionSchema>;
