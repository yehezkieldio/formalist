import type { RouteType } from "#/server/db/schema";

export interface NormalizedRoute {
    routeType: RouteType;
    transitRoute: string | null;
}

export function normalizeRoute(input: {
    routeType?: string | null;
    transitRoute?: string | null;
}): NormalizedRoute {
    const route = input.routeType?.trim().toUpperCase();
    const transitRoute = input.transitRoute?.trim() || null;

    if (route?.includes("DIRECT") || route === "D") {
        return { routeType: "DIRECT", transitRoute: null };
    }

    if (route?.includes("TRANSIT") || transitRoute) {
        return { routeType: "TRANSIT", transitRoute };
    }

    if (route === "ANY" || route === "ALL") {
        return { routeType: "ANY", transitRoute };
    }

    return { routeType: "UNKNOWN", transitRoute };
}
