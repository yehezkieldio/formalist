import { describe, expect, it } from "vitest";

import { tariffSearchConditions } from "#/server/retrieval/structured-search";

describe("structured tariff search", () => {
    it("defaults to active reviewed rows only", () => {
        expect(tariffSearchConditions({})).toHaveLength(1);
        expect(
            tariffSearchConditions({
                airline: "Pelita Air",
                destinationCode: "SUB",
                isPromo: false,
                routeType: "DIRECT",
            })
        ).toHaveLength(5);
    });
});
