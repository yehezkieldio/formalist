import { isAfter, isBefore, isValid, parseISO, startOfDay } from "date-fns";

export interface ValidityResult {
    effectiveDate: string | null;
    issues: string[];
    validFrom: string | null;
    validUntil: string | null;
}

function parseDate(value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }

    const parsed = parseISO(value);

    return isValid(parsed) ? value : null;
}

export function normalizeValidity(input: {
    effectiveDate?: string | null;
    now?: Date;
    validFrom?: string | null;
    validUntil?: string | null;
}): ValidityResult {
    const effectiveDate = parseDate(input.effectiveDate ?? null);
    const validFrom = parseDate(input.validFrom ?? null);
    const validUntil = parseDate(input.validUntil ?? null);
    const issues: string[] = [];

    if (!effectiveDate && !validFrom && !validUntil) {
        issues.push("missing_validity_dates");
    }

    if (
        validFrom &&
        validUntil &&
        isAfter(parseISO(validFrom), parseISO(validUntil))
    ) {
        issues.push("invalid_validity_range");
    }

    if (
        validUntil &&
        isBefore(parseISO(validUntil), startOfDay(input.now ?? new Date()))
    ) {
        issues.push("expired_validity");
    }

    return {
        effectiveDate,
        issues,
        validFrom,
        validUntil,
    };
}
