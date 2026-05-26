import { classifyReviewStatus } from "./status";

export function validateQuoteInputs(input: {
    smuPricePerKg?: number | null;
    status?: string | null;
    validUntil?: string | null;
    weightKg: number;
}) {
    const warnings: string[] = [];
    const trustStatus = classifyReviewStatus(input);

    if (trustStatus !== "active") {
        warnings.push(`Tariff row is ${trustStatus}.`);
    }
    if (!input.smuPricePerKg) {
        warnings.push("Tariff row is missing SMU price.");
    }
    if (input.weightKg <= 0) {
        warnings.push("Weight must be greater than zero.");
    }

    return {
        trustStatus,
        warnings,
    };
}
