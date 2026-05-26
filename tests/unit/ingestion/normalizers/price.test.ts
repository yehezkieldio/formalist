import { describe, expect, it } from "vitest";

import { parsePrice } from "#/server/ingestion/normalizers/price";

describe("price parser", () => {
    it("parses common IDR price formats", () => {
        expect(parsePrice("Rp 18.000")).toMatchObject({
            amount: 18_000,
            normalizedText: "18000",
            status: "numeric",
        });
        expect(parsePrice("IDR 18,000")).toMatchObject({
            amount: 18_000,
            status: "numeric",
        });
    });

    it("classifies N/A, missing, and invalid values", () => {
        expect(parsePrice("N/A").status).toBe("na");
        expect(parsePrice(null).status).toBe("missing");
        expect(parsePrice("call admin").status).toBe("invalid");
    });
});
