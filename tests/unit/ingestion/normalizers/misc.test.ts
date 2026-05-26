import { describe, expect, it } from "vitest";

import { normalizeAirline } from "#/server/ingestion/normalizers/airline";
import { normalizeValidity } from "#/server/ingestion/normalizers/date";
import { propagatePromo } from "#/server/ingestion/normalizers/promo";
import { normalizeRoute } from "#/server/ingestion/normalizers/route";

describe("misc ingestion normalizers", () => {
    it("normalizes airlines, routes, dates, and promo inheritance", () => {
        expect(normalizeAirline(" pelita ")).toEqual({
            canonical: "Pelita Air",
            issues: [],
        });
        expect(
            normalizeRoute({ routeType: "transit", transitRoute: "CGK" })
        ).toEqual({
            routeType: "TRANSIT",
            transitRoute: "CGK",
        });
        expect(
            propagatePromo({ documentIsPromo: true, rowIsPromo: null })
        ).toBe(true);
    });

    it("flags expired and missing validity windows", () => {
        expect(
            normalizeValidity({
                now: new Date("2026-05-25T00:00:00Z"),
                validUntil: "2026-05-01",
            }).issues
        ).toContain("expired_validity");

        expect(normalizeValidity({}).issues).toContain(
            "missing_validity_dates"
        );
    });
});
