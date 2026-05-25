export type TrustStatus =
    | "active"
    | "conflicting"
    | "expired"
    | "missing"
    | "unreviewed";

export function classifyReviewStatus(input: {
    status?: string | null;
    validUntil?: string | null;
    now?: Date;
}): TrustStatus {
    if (!input.status) {
        return "missing";
    }

    if (input.status !== "active") {
        return "unreviewed";
    }

    if (
        input.validUntil &&
        new Date(input.validUntil) < (input.now ?? new Date())
    ) {
        return "expired";
    }

    return "active";
}
