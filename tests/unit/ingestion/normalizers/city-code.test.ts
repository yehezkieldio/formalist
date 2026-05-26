import { describe, expect, it } from "vitest";

import { normalizeCityCode } from "#/server/ingestion/normalizers/city-code";

describe("city and airport code normalizer", () => {
    it("detects ambiguous Jogja aliases across JOG and YIA", () => {
        expect(normalizeCityCode({ city: "Jogja" })).toMatchObject({
            candidate: null,
            issues: ["ambiguous_destination_alias"],
        });
    });

    it("detects city/code mismatches", () => {
        expect(
            normalizeCityCode({ city: "Surabaya", code: "UPG" })
        ).toMatchObject({
            candidate: {
                city: "Makassar",
                code: "UPG",
            },
            issues: ["city_code_mismatch"],
        });
    });

    it("uses fuzzy aliases for close city spellings", () => {
        expect(normalizeCityCode({ city: "Surabya" })).toMatchObject({
            candidate: {
                city: "Surabaya",
                code: "SUB",
            },
            issues: [],
        });
    });
});
