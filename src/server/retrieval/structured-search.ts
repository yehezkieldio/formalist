import { and, eq, ilike } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { getDatabase } from "#/server/db";
import { tariffRows } from "#/server/db/schema";
import type { ReviewStatus, RouteType } from "#/server/db/schema";

export interface TariffSearchFilters {
    airline?: string;
    destinationCode?: string;
    destinationCity?: string;
    isPromo?: boolean;
    originAirport?: string;
    originCity?: string;
    routeType?: RouteType;
    status?: ReviewStatus;
}

export function tariffSearchConditions(input: TariffSearchFilters) {
    const conditions: SQL[] = [];

    if (input.status) {
        conditions.push(eq(tariffRows.status, input.status));
    }

    if (input.airline) {
        conditions.push(ilike(tariffRows.airline, input.airline));
    }
    if (input.destinationCity) {
        conditions.push(
            ilike(tariffRows.destinationCity, input.destinationCity)
        );
    }
    if (input.destinationCode) {
        conditions.push(
            ilike(tariffRows.destinationCode, input.destinationCode)
        );
    }
    if (input.originCity) {
        conditions.push(ilike(tariffRows.originCity, input.originCity));
    }
    if (input.originAirport) {
        conditions.push(ilike(tariffRows.originAirport, input.originAirport));
    }
    if (input.routeType) {
        conditions.push(eq(tariffRows.routeType, input.routeType));
    }
    if (input.isPromo !== undefined) {
        conditions.push(eq(tariffRows.isPromo, input.isPromo));
    }

    return conditions;
}

export function searchTariffs(input: TariffSearchFilters) {
    const conditions = tariffSearchConditions(input);

    return getDatabase()
        .select()
        .from(tariffRows)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
}
