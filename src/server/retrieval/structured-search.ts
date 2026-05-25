import { and, eq } from "drizzle-orm";

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
    const conditions = [eq(tariffRows.status, input.status ?? "active")];

    if (input.airline) {
        conditions.push(eq(tariffRows.airline, input.airline));
    }
    if (input.destinationCity) {
        conditions.push(eq(tariffRows.destinationCity, input.destinationCity));
    }
    if (input.destinationCode) {
        conditions.push(eq(tariffRows.destinationCode, input.destinationCode));
    }
    if (input.originCity) {
        conditions.push(eq(tariffRows.originCity, input.originCity));
    }
    if (input.originAirport) {
        conditions.push(eq(tariffRows.originAirport, input.originAirport));
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
    return getDatabase()
        .select()
        .from(tariffRows)
        .where(and(...tariffSearchConditions(input)));
}
