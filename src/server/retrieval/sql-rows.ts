interface QueryResultLike<T> {
    rows?: T[];
}

export function getSqlRows<T>(result: unknown): T[] {
    if (Array.isArray(result)) {
        return result as T[];
    }

    const queryResult = result as QueryResultLike<T>;
    return queryResult.rows ?? [];
}
