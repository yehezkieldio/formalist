import { describe, expect, it } from "vitest";

import { assertNoBlockingIssueRecords } from "#/server/ingestion/review/bulk-actions";

describe("review state rules", () => {
    it("allows approval when no high open issues exist", () => {
        expect(() =>
            assertNoBlockingIssueRecords(
                [
                    {
                        severity: "medium",
                        sourceId: "row-1",
                        sourceType: "tariff_row",
                        status: "open",
                    },
                ],
                { sourceIds: ["row-1"], sourceType: "tariff_row" }
            )
        ).not.toThrow();
    });

    it("blocks approval when high open issues exist", () => {
        expect(() =>
            assertNoBlockingIssueRecords(
                [
                    {
                        severity: "high",
                        sourceId: "row-1",
                        sourceType: "tariff_row",
                        status: "open",
                    },
                ],
                { sourceIds: ["row-1"], sourceType: "tariff_row" }
            )
        ).toThrow("Cannot approve row-1");
    });
});
