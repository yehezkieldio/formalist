export function propagatePromo(input: {
    documentIsPromo?: boolean | null;
    rowIsPromo?: boolean | null;
}): boolean {
    return input.rowIsPromo ?? input.documentIsPromo ?? false;
}
