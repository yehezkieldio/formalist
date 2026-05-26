import Decimal from "decimal.js";

import type { feeRules, tariffRows } from "#/server/db/schema";

import { validateQuoteInputs } from "./validation";

type TariffRowRecord = typeof tariffRows.$inferSelect;
type FeeRuleRecord = typeof feeRules.$inferSelect;

export interface QuoteLine {
    amount: string;
    label: string;
    sourceId?: string;
}

export interface QuoteResult {
    billableWeightKg: string;
    lines: QuoteLine[];
    sourceIds: string[];
    total: string;
    warnings: string[];
}

function money(value: Decimal) {
    return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0);
}

function buildQuoteLines(input: {
    admin: Decimal;
    base: Decimal;
    feeRule?: FeeRuleRecord | null;
    ppn: Decimal;
    surcharge: Decimal;
    tariffRow: TariffRowRecord;
    warehouse: Decimal;
    warehouseAdmin: Decimal;
}): QuoteLine[] {
    return [
        {
            amount: money(input.base),
            label: "Base SMU",
            sourceId: input.tariffRow.id,
        },
        {
            amount: money(input.admin),
            label: "Airline admin",
            sourceId: input.feeRule?.id,
        },
        {
            amount: money(input.warehouse),
            label: "Warehouse fee",
            sourceId: input.feeRule?.id,
        },
        {
            amount: money(input.warehouseAdmin),
            label: "Warehouse admin",
            sourceId: input.feeRule?.id,
        },
        {
            amount: money(input.surcharge),
            label: "Surcharge",
            sourceId: input.feeRule?.id,
        },
        {
            amount: money(input.ppn),
            label: "PPN",
            sourceId: input.feeRule?.id,
        },
    ];
}

export function calculateQuote(input: {
    feeRule?: FeeRuleRecord | null;
    surcharge?: number;
    tariffRow: TariffRowRecord;
    weightKg: number;
}): QuoteResult {
    const { feeRule, tariffRow } = input;
    const validation = validateQuoteInputs({
        smuPricePerKg: tariffRow.smuPricePerKg,
        status: tariffRow.status,
        validUntil: tariffRow.validUntil,
        weightKg: input.weightKg,
    });
    const minWeight = new Decimal(feeRule?.minWeightKg ?? 0);
    const billableWeight = Decimal.max(new Decimal(input.weightKg), minWeight);
    const smuPrice = new Decimal(tariffRow.smuPricePerKg ?? 0);
    const base = billableWeight.mul(smuPrice);
    const admin = new Decimal(feeRule?.adminFeePerSmu ?? 0);
    const warehouse = billableWeight.mul(feeRule?.warehouseFeePerKg ?? 0);
    const warehouseAdmin = new Decimal(feeRule?.warehouseAdminPerSmu ?? 0);
    const surcharge = new Decimal(input.surcharge ?? feeRule?.dgSurcharge ?? 0);
    const subtotal = base
        .plus(admin)
        .plus(warehouse)
        .plus(warehouseAdmin)
        .plus(surcharge);
    const ppn = subtotal.mul(new Decimal(feeRule?.ppnPercent ?? 0).div(100));
    const total = subtotal.plus(ppn);
    const lines = buildQuoteLines({
        admin,
        base,
        feeRule,
        ppn,
        surcharge,
        tariffRow,
        warehouse,
        warehouseAdmin,
    });
    const warnings = [...validation.warnings];

    if (!feeRule) {
        warnings.push("Fee rule is missing; fee lines defaulted to zero.");
    }

    return {
        billableWeightKg: billableWeight.toString(),
        lines,
        sourceIds: [tariffRow.id, feeRule?.id].filter(Boolean) as string[],
        total: money(total),
        warnings,
    };
}
