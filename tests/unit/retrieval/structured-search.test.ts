import { describe, expect, it } from "vitest";

import { tariffSearchConditions } from "#/server/retrieval/structured-search";

describe("structured tariff search", () => {
    it("does not add a review-status gate by default", () => {
        expect(tariffSearchConditions({})).toHaveLength(0);
        expect(
            tariffSearchConditions({
                airline: "Pelita Air",
                destinationCode: "SUB",
                isPromo: false,
                routeType: "DIRECT",
            })
        ).toHaveLength(4);
    });
});
