import * as z from "zod";

import { reviewStatuses, routeTypes, priceStatuses } from "#/server/db/schema";

export const reviewStatusSchema = z.object({
    status: z.enum(reviewStatuses),
});

export const tariffRowReviewSchema = z
    .object({
        airline: z.string().trim().nullable().optional(),
        destinationCity: z.string().trim().nullable().optional(),
        destinationCode: z.string().trim().nullable().optional(),
        flightNumber: z.string().trim().nullable().optional(),
        priceStatus: z.enum(priceStatuses).optional(),
        routeType: z.enum(routeTypes).optional(),
        schedule: z.string().trim().nullable().optional(),
        smuPricePerKg: z.number().int().nonnegative().nullable().optional(),
        status: z.enum(reviewStatuses).optional(),
        transitRoute: z.string().trim().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0);

export const feeRuleReviewSchema = z
    .object({
        adminFeePerSmu: z.number().int().nonnegative().nullable().optional(),
        dgSurcharge: z.number().int().nonnegative().nullable().optional(),
        minWeightKg: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        ppnPercent: z.string().nullable().optional(),
        status: z.enum(reviewStatuses).optional(),
        warehouseAdminPerSmu: z
            .number()
            .int()
            .nonnegative()
            .nullable()
            .optional(),
        warehouseFeePerKg: z.number().int().nonnegative().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0);

export const factReviewSchema = z
    .object({
        status: z.enum(reviewStatuses).optional(),
        valueNumber: z.string().nullable().optional(),
        valueText: z.string().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0);
